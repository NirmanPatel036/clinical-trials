"""HTTP API over the backend. Run from the project root: uvicorn backend.api:app"""

import os
import threading
import time
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv

# Before the package imports, so .env can set ORVANT_DATA_DIR. Serving never downloads model weights: they come from the
# local Hugging Face cache, filled once at build time by `python -m backend.fetch_model`. Set HF_HUB_OFFLINE=0 to allow it.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
os.environ.setdefault("HF_HUB_OFFLINE", "1")

import jwt  # noqa: E402
from fastapi import Depends, FastAPI, Header, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel, Field, model_validator  # noqa: E402

from . import knowledge, match  # noqa: E402
from .answer import answer_with, chat_models  # noqa: E402
from .decide import DecisionConfig, decide  # noqa: E402
from .index import EMBED_REVISION, Index, StaleIndexError, load_active, st_embedder  # noqa: E402
from .ingest import DATA_DIR  # noqa: E402
from .query_plan import parse_query  # noqa: E402
from .retrieve import search  # noqa: E402
from .schema import PatientFacts, Phase, Sex, Status  # noqa: E402

PATIENTS_PATH = match.PATIENTS_PATH
# The synthetic patient every signed-in account may match, for people who are not patients themselves.
DEMO_PATIENT = "patient-1e8f31fa-e6b0-4294-8af7-66ff9ae572e0"
REVIEW = "Trial discovery aid only. Not an eligibility decision; a clinician must verify every result against the current registry record."

# What /ready reports; preload() fills it.
READY: dict = {"ready": False, "reason": "starting"}


@asynccontextmanager
async def lifespan(app):
    # The first user would otherwise pay for loading the index and model (about 10 s, most of it importing torch).
    preload()
    yield


app = FastAPI(title="NexTrial API", version="0.1.0", lifespan=lifespan)
if os.getenv("CORS_ORIGINS"):
    app.add_middleware(CORSMiddleware, allow_origins=os.environ["CORS_ORIGINS"].split(","), allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"])


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    status: list[Status] = []
    phase: list[Phase] = []
    sex: Sex | None = None
    age: int | None = Field(default=None, ge=0, le=120)
    location: str | None = Field(default=None, max_length=100)
    mode: Literal["hybrid", "dense", "bm25"] = "hybrid"
    final_k: int = Field(default=10, ge=1, le=30)


class SelfProfile(BaseModel):
    """The signed-in user's own facts, as their profile holds them. Name, birth year, email and place are not accepted."""
    model_config = {"extra": "forbid"}
    age: int = Field(ge=0, le=120)
    sex: Literal["FEMALE", "MALE"]
    diagnosis: str = Field(min_length=1, max_length=100)
    stage: str | None = Field(default=None, max_length=50)
    stage_details: str | None = Field(default=None, max_length=200)
    disease_status: str | None = Field(default=None, max_length=50)
    biomarkers: list[str] = Field(default=[], max_length=20)
    ecog: int | None = Field(default=None, ge=0, le=4)
    medications: list[str] = Field(default=[], max_length=30)
    procedures: list[str] = Field(default=[], max_length=30)


class MatchRequest(BaseModel):
    # Exactly one: a synthetic patient's id, or the user's own profile.
    patient_id: str | None = Field(default=None, min_length=1, max_length=100)
    profile: SelfProfile | None = None
    k: int = Field(default=5, ge=1, le=10)
    judge: Literal["none", "selective"] = "none"
    threshold: float = Field(default=0.9, ge=0.5, le=0.99)

    @model_validator(mode="after")
    def one_patient(self):
        if (self.patient_id is None) == (self.profile is None):
            raise ValueError("send either patient_id or profile")
        return self


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    # Oldest first, ending with the question to answer; the client trims older turns.
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)
    provider: Literal["gemini", "groq", "huggingface", "openrouter"] = "gemini"
    # Also search PubMed. Questions that ask for papers or literature search it anyway.
    literature: bool = False


@lru_cache
def _index() -> tuple[Index, frozenset[str]]:
    index = load_active()
    places = frozenset(p.casefold() for r in index.records.values() for l in r.locations for p in (l.city, l.state, l.country) if p)
    return index, places


# lru_cache lets two first requests load at once; Chroma's client setup is not safe to run concurrently.
_LOAD_LOCK = threading.Lock()


def index_resources() -> tuple[Index, frozenset[str]]:
    try:
        with _LOAD_LOCK:
            return _index()
    except StaleIndexError as error:
        raise HTTPException(503, f"index unavailable: {error}")


@lru_cache
def _embedder(model: str, revision: str):
    return st_embedder(model, revision)


def model_revision(manifest: dict) -> str:
    """The weights the index was built with; manifests from before revisions were recorded used EMBED_REVISION."""
    return manifest.get("embedding_model_revision") or EMBED_REVISION


def embedder(resources=Depends(index_resources)):
    with _LOAD_LOCK:
        return _embedder(resources[0].manifest["embedding_model"], model_revision(resources[0].manifest))


@lru_cache
def _jwks(url: str) -> jwt.PyJWKClient:
    return jwt.PyJWKClient(f"{url.rstrip('/')}/auth/v1/.well-known/jwks.json")


def current_user(authorization: str = Header(default="")) -> dict:
    """Verified Supabase claims. A shared secret means HS256; otherwise the project's published signing keys are used."""
    secret, url = os.getenv("SUPABASE_JWT_SECRET"), os.getenv("SUPABASE_URL")
    if not (secret or url):
        raise HTTPException(503, "authentication is not configured")
    token = authorization.removeprefix("Bearer ").strip()
    checks = {"audience": "authenticated", "options": {"require": ["exp", "sub"]}}
    try:
        if secret:
            claims = jwt.decode(token, secret, algorithms=["HS256"], **checks)
        else:
            claims = jwt.decode(token, _jwks(url).get_signing_key_from_jwt(token).key, algorithms=["ES256", "RS256"], **checks)
    except jwt.PyJWTError:
        raise HTTPException(401, "invalid or expired token")
    # Health data sits behind both factors: an email-code-only session (aal1) is not enough.
    if claims.get("aal") != "aal2":
        raise HTTPException(401, "second factor required")
    return claims


def log_dir() -> Path:
    """Where audit.jsonl and decisions.jsonl go: ORVANT_LOG_DIR (a persistent disk), else the data directory."""
    return Path(os.getenv("ORVANT_LOG_DIR") or DATA_DIR)


def audit_problem() -> str | None:
    """Why access logs would be lost or unwritable, or None. Matching refuses to run unlogged, so this gates readiness."""
    if os.getenv("ORVANT_AUDIT_SINK") == "stdout":
        return None
    # Cloud Run sets K_SERVICE; its container disk lives in memory and vanishes with the instance.
    if os.getenv("K_SERVICE") and not os.getenv("ORVANT_LOG_DIR"):
        return "the container disk is temporary here: set ORVANT_LOG_DIR to a mounted volume or ORVANT_AUDIT_SINK=stdout"
    directory = log_dir()
    try:
        directory.mkdir(parents=True, exist_ok=True)
    except OSError as error:
        return f"audit log directory {directory} cannot be created ({type(error).__name__})"
    return None if os.access(directory, os.W_OK) else f"audit log directory {directory} is not writable"


def preload() -> None:
    """Load the index and embedding model, encode once so the first search is not slow, and check the audit log; never raises."""
    try:
        resources = index_resources()
        # Timed from here: importing torch, loading the weights and the first (slow) encode.
        started = time.perf_counter()
        embedder(resources)(["warm-up query"])
        model_ms = round((time.perf_counter() - started) * 1000)
        problem = audit_problem()
        manifest = resources[0].manifest
        READY.clear()
        READY.update({"ready": False, "reason": problem} if problem else
                     {"ready": True, "index_version": manifest["index_version"], "embedding_model": manifest["embedding_model"],
                      "embedding_model_revision": model_revision(manifest), "model_ready_ms": model_ms})
    except Exception as error:
        READY.clear()
        READY.update(ready=False, reason=error.detail if isinstance(error, HTTPException) else f"{type(error).__name__}: {error}")


def _freshness(manifest: dict) -> dict:
    age = (datetime.now(timezone.utc) - datetime.fromisoformat(manifest["ingested_at"])).days if manifest.get("ingested_at") else None
    return {"index_version": manifest["index_version"], "registry_data_timestamp": manifest.get("data_timestamp"), "ingested_at": manifest.get("ingested_at"),
            "snapshot_age_days": age, "build_status": manifest["build_status"]}


@app.get("/ready")
def ready():
    """200 once the index, model and audit log are usable; 503 with the reason otherwise. A failed start is retried here."""
    if not READY["ready"]:
        preload()
    if not READY["ready"]:
        raise HTTPException(503, READY["reason"])
    return READY


@app.get("/health")
def health(resources=Depends(index_resources)):
    return {"status": "ok", **_freshness(resources[0].manifest)}


def paid_judges_enabled() -> bool:
    return os.getenv("NEXTRIAL_ALLOW_PAID_JUDGES") == "1" and bool(os.getenv("TYPESAFE_API_KEY"))


@app.get("/api/stats")
def stats(resources=Depends(index_resources)):
    index = resources[0]
    counts = {key: index.manifest.get(key) for key in ("raw_count", "unique_count", "accepted_count", "rejected_count", "chunk_count")}
    return {**_freshness(index.manifest), "trials": len(index.records), **counts, "embedding_model": index.manifest["embedding_model"], "judge_model": chat_models()["groq"],
            "chat_models": chat_models(), "paid_judges": paid_judges_enabled(), "demo_patient": DEMO_PATIENT}


@app.post("/api/search")
def search_trials(request: SearchRequest, user=Depends(current_user), resources=Depends(index_resources), embed=Depends(embedder)):
    index, places = resources
    plan = parse_query(request.query, places)
    # Explicit fields override whatever was parsed from the text, as in the workbench.
    explicit = {"status": request.status, "phase": request.phase, "sex": request.sex, "age": request.age, "location": (request.location or "").strip().casefold() or None}
    plan = plan.model_copy(update={key: value for key, value in explicit.items() if value not in (None, [])})
    trace = search(index, plan, request.query, embed, mode=request.mode, final_k=request.final_k)
    results = []
    for hit in trace["results"]:
        record = index.records[hit["nct_id"]]
        results.append({**hit, "title": record.title, "overall_status": record.overall_status, "phases": record.phases, "source_url": record.source_url, "last_update_post_date": record.last_update_post_date})
    return {"plan": plan, "trials_passing_hard_filters": trace["allowed_trials"], "results": results, **_freshness(index.manifest), "clinical_review_required": True, "notice": REVIEW}


@app.post("/api/match")
def match_patient(request: MatchRequest, user=Depends(current_user), resources=Depends(index_resources), embed=Depends(embedder)):
    index = resources[0]
    if request.profile:
        # The user is the patient: their own facts, sent by them, audited as "self".
        facts, matches = match.match_facts(index, embed, user["sub"], PatientFacts(patient_id="self", **request.profile.model_dump()), k=request.k, data_dir=log_dir())
    else:
        # Grants come from app_metadata, which only the Supabase service role can write; the demo patient is open to every account.
        grants = {user["sub"]: set((user.get("app_metadata") or {}).get("patient_ids") or []) | {DEMO_PATIENT}}
        try:
            facts, matches = match.match_patient(index, embed, user["sub"], request.patient_id, grants, k=request.k, patients_path=PATIENTS_PATH, data_dir=log_dir())
        except PermissionError:
            raise HTTPException(403, "not authorised for this patient")
        except StopIteration:
            raise HTTPException(404, "patient record not found")
    if request.judge == "selective":
        # Paid model calls stay off unless the deployment opts in.
        if os.getenv("NEXTRIAL_ALLOW_PAID_JUDGES") != "1":
            raise HTTPException(403, "model judges are disabled on this deployment")
        if not os.getenv("TYPESAFE_API_KEY"):
            raise HTTPException(503, "TYPESAFE_API_KEY is not configured")
        config = DecisionConfig(threshold=request.threshold)
        # Jev's escalations go to Groq. Without a Groq key and model they stay unknown, with a note.
        groq_keys = os.getenv("GROQ_API_KEYS") if chat_models()["groq"] else None
        try:
            matches = [decide(m, facts, index.records[m.trial_id], os.environ["TYPESAFE_API_KEY"], groq_keys, config, log_dir(), judge_provider="groq") for m in matches]
        except Exception as error:
            # A failed judge returns an error, never a half-judged result that could be mistaken for a complete one.
            raise HTTPException(502, f"model judge failed ({type(error).__name__}); no judged result returned")
        matches.sort(key=lambda m: -m.score)
    birth_date = None if request.profile else match.synthetic_birth_date(facts.patient_id, PATIENTS_PATH)
    return {"patient_id": facts.patient_id, "synthetic_birth_date": birth_date, "facts": match.fact_lines(facts), "matches": matches, **_freshness(index.manifest),
            "clinical_review_required": True, "notice": REVIEW}


CHAT_SOURCES = 6


def _lookup(name: str, call, *args) -> tuple[list[dict], str | None]:
    """An outside lookup that fails is reported in the answer's limitations, never fails the chat."""
    try:
        return call(*args), None
    except Exception as error:
        return [], f"{name} could not be reached ({type(error).__name__}), so it is not included"


@app.post("/api/chat")
def chat(request: ChatRequest, user=Depends(current_user), resources=Depends(index_resources), embed=Depends(embedder)):
    """Answers the last question from the indexed trials; inline [NCT…] citations refer to the returned sources.

    PubMed abstracts and ICD-10-CM codes are added as separately labelled evidence and never change which trials are retrieved.
    RxNorm only adds generic names for brands named as prior therapy to the trial search, and the reply lists them. Matching uses none of this.
    """
    *history, question = request.messages
    if question.role != "user":
        raise HTTPException(422, "the last message must be the user's question")
    if not chat_models()[request.provider]:
        raise HTTPException(503, f"{request.provider} is not configured on this deployment")
    index, places = resources
    text = question.content[:500]
    plan = parse_query(text, places)
    # Only topic words leave the server: ages, places, pronouns and long numbers are stripped first.
    terms = knowledge.search_terms(text, places)
    code_terms = " ".join(plan.conditions) or terms
    words = knowledge.prior_therapy_words(text)
    with ThreadPoolExecutor(2) as pool:
        papers = pool.submit(_lookup, "PubMed", knowledge.search_pubmed, terms) if (request.literature or plan.intent == "literature") and terms else None
        lookup = pool.submit(_lookup, "The ICD-10-CM lookup", knowledge.lookup_icd10cm, code_terms) if knowledge.wants_icd(text) and code_terms else None
        # Brand names after "after", "progressed on"… are searched with their generic names too; the reply lists what was added.
        drugs, drug_note = _lookup("RxNorm", knowledge.generic_names, words) if words else ([], None)
        query = " ".join([text, *(g for d in drugs for g in d["generics"])])
        # ponytail: retrieval reads only the latest question; a follow-up like "and in Texas?" loses the earlier topic. Rewrite the query from history if that bites.
        results = search(index, plan, query, embed, final_k=CHAT_SOURCES)["results"]
        articles, paper_note = papers.result() if papers else ([], None)
        codes, code_note = lookup.result() if lookup else ([], None)
    if not (results or articles or codes):
        answer = {"answer": "I couldn't find any trials in our index that match that. Try naming the diagnosis, treatment or biomarker.", "limitations": [], "evidence_spans": [], "literature_spans": []}
    else:
        try:
            answer = answer_with(request.provider, question.content, results, [m.model_dump() for m in history], articles=articles, codes=codes).model_dump()
        except Exception as error:
            # RuntimeErrors are our own plain messages; vendor errors are named by type only.
            reason = str(error) if isinstance(error, RuntimeError) else type(error).__name__
            raise HTTPException(502, f"The answer service didn't respond ({reason}). Try again in a moment or pick another model.")
    sources = []
    for hit in results:
        record = index.records[hit["nct_id"]]
        quotes = [span["quote"] for span in answer["evidence_spans"] if span["nct_id"] == hit["nct_id"]]
        sources.append({"nct_id": hit["nct_id"], "title": record.title, "overall_status": record.overall_status, "phases": record.phases, "source_url": record.source_url,
                        "last_update_post_date": record.last_update_post_date, "quotes": quotes})
    literature = [{**{k: a[k] for k in ("pmid", "title", "journal", "year", "url")}, "quotes": [s["quote"] for s in answer["literature_spans"] if s["pmid"] == a["pmid"]]} for a in articles]
    model = f"{request.provider}:{chat_models()[request.provider]}" if results or articles or codes else None
    return {"answer": answer["answer"], "sources": sources, "articles": literature, "codes": codes, "drugs": drugs, "limitations": answer["limitations"] + [n for n in (paper_note, code_note, drug_note) if n],
            "model": model, **_freshness(index.manifest), "clinical_review_required": True, "notice": REVIEW}
