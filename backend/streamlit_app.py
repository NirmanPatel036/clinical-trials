"""NexTrial workbench. Run from the project root: streamlit run backend/streamlit_app.py"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import streamlit as st
from dotenv import load_dotenv

from backend import decide, match
from backend.answer import generate_answer
from backend.build import smoke_checks
from backend.index import EMBED_REVISION, StaleIndexError, load_active, st_embedder
from backend.query_plan import parse_query
from backend.retrieve import search
from backend.schema import Phase, Sex, Status

FIXED_QUERIES = [
    "HER2-positive breast cancer",
    "EGFR mutant non-small cell lung cancer osimertinib",
    "BRAF V600E melanoma immunotherapy",
    "KRAS G12C colorectal cancer",
    "PARP inhibitor BRCA ovarian cancer",
    "CAR-T relapsed leukemia",
]

load_dotenv(ROOT / ".env")
st.set_page_config(page_title="NexTrial workbench", layout="wide")
st.title("NexTrial retrieval workbench")
st.warning("Trial discovery aid only. Nothing here is an eligibility decision; verify every result against the current ClinicalTrials.gov record with a clinician.")


@st.cache_resource
def resources():
    index = load_active()
    places = frozenset(p.casefold() for r in index.records.values() for l in r.locations for p in (l.city, l.state, l.country) if p)
    return index, st_embedder(index.manifest["embedding_model"], index.manifest.get("embedding_model_revision") or EMBED_REVISION), places


@st.cache_resource
def reranker():
    from sentence_transformers import CrossEncoder

    model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return lambda query, texts: model.predict([(query, text) for text in texts]).tolist()


try:
    index, embed, places = resources()
except StaleIndexError as error:
    st.error(f"Index unavailable: {error}")
    st.stop()
manifest = index.manifest
age_days = (datetime.now(timezone.utc) - datetime.fromisoformat(manifest["ingested_at"])).days

with st.sidebar:
    st.header("Explicit filters")
    st.caption("These override whatever is parsed from the query text.")
    f_status = st.multiselect("Status", [s.value for s in Status])
    f_phase = st.multiselect("Phase", [p.value for p in Phase])
    f_sex = st.selectbox("Patient sex", ["(from query)", Sex.FEMALE.value, Sex.MALE.value])
    f_age = st.number_input("Patient age (years)", min_value=0, max_value=120, value=None, step=1)
    f_biomarker = st.text_input("Biomarker")
    f_location = st.text_input("Location (city, state or country)")
    max_age_days = st.number_input("Freshness: fail if snapshot older than (days)", min_value=1, value=7)
    st.header("Retrieval")
    mode = st.radio("Mode", ["hybrid", "dense", "bm25"], horizontal=True)
    top_n = st.slider("Candidates per retriever", 20, 150, 100, 10)
    final_k = st.slider("Trials returned", 1, 30, 10)
    use_reranker = st.checkbox("Cross-encoder reranker")

tasks = (Path(__file__).parent / "TASKS.md").read_text()
with st.expander(f"Task tracker: {tasks.count('- [x]')} done, {tasks.count('- [ ]')} open"):
    st.markdown(tasks)

query = st.text_input("Query", placeholder="e.g. phase 3 recruiting HER2-positive breast cancer trials for women in Texas")
tabs = st.tabs(["Query plan", "Retrieval trace", "Evidence", "Answer", "Patient match", "Evaluation", "System"])

if not query:
    tabs[0].info(f"Enter a query for the search tabs. Index {manifest['index_version']}: {len(index.records):,} trials, {len(index.chunks):,} chunks, snapshot {age_days} day(s) old.")
else:
    plan = parse_query(query, places)
    overrides = {
        "status": [Status(s) for s in f_status],
        "phase": [Phase(p) for p in f_phase],
        "sex": Sex(f_sex) if f_sex in Sex.__members__ else None,
        "age": f_age,
        "location": f_location.strip().casefold() or None,
        "biomarkers": plan.biomarkers + [f_biomarker.strip()] if f_biomarker.strip() else None,
    }
    plan = plan.model_copy(update={k: v for k, v in overrides.items() if v not in (None, [])})
    search_text = f"{query} {f_biomarker}".strip()

    if age_days > max_age_days:
        st.error(f"Snapshot is {age_days} days old (limit {max_age_days}). Rebuild with `python -m backend.build` before relying on status or recruitment facts.")

    started = time.perf_counter()
    trace = search(index, plan, search_text, embed, mode=mode, top_n=top_n, final_k=final_k, rerank=reranker() if use_reranker else None)
    latency = time.perf_counter() - started
    results = trace["results"]


    with tabs[0]:
        for unknown in plan.unknowns:
            st.warning(f"Not applied as a filter: {unknown}")
        if plan.intent in ("patient_match", "literature"):
            st.info(f"Intent '{plan.intent}' is not built in this round; running a trial search instead.")
        st.caption("Conditions, biomarkers and stage steer ranking only. Status, phase, sex, age, location and NCT IDs are hard filters. Live lookups: not used.")
        st.json(plan.model_dump(mode="json"))

    with tabs[1]:
        allowed = trace["allowed_trials"]
        a, b, c, d = st.columns(4)
        a.metric("Trials passing hard filters", "all" if allowed is None else allowed)
        b.metric("Dense chunk hits", len(trace["dense"]))
        c.metric("BM25 chunk hits", len(trace["bm25"]))
        d.metric("Search time", f"{latency * 1000:.0f} ms")
        if allowed == 0:
            st.error("No trial satisfies the hard filters. Nothing was retrieved; there is no unfiltered fallback.")
        st.subheader("Final ranking (one row per trial)")
        st.dataframe([{"fused_rank": r["fused_rank"], "nct_id": r["nct_id"], "rrf_score": round(r["rrf_score"], 5), "rerank_score": r["rerank_score"], "title": index.records[r["nct_id"]].title} for r in results], width="stretch")
        left, right = st.columns(2)
        left.subheader("Dense (cosine distance, lower is closer)")
        left.dataframe([{"chunk": i, "distance": round(s, 4)} for i, s in trace["dense"][:30]], width="stretch")
        right.subheader("BM25 (score, higher is closer)")
        right.dataframe([{"chunk": i, "score": round(s, 2)} for i, s in trace["bm25"][:30]], width="stretch")
        st.caption("These are ranking signals, not confidence or eligibility probabilities.")

    with tabs[2]:
        for r in results:
            record = index.records[r["nct_id"]]
            with st.expander(f"{record.nct_id} · {record.title}"):
                st.markdown(f"[{record.source_url}]({record.source_url}) · **{record.overall_status}** · {'/'.join(record.phases) or 'phase not stated'} · sex {record.sex} · ages {record.minimum_age or 0:g}–{record.maximum_age if record.maximum_age is not None else 'no limit'} · registry update {record.last_update_post_date} · index {manifest['index_version']}")
                for chunk in r["chunks"]:
                    st.caption(f"{chunk['id']} · dense {chunk['dense_distance']} · bm25 {chunk['bm25_score']}")
                    st.text(chunk["text"])

    with tabs[3]:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            st.info("Set GOOGLE_API_KEY in the environment or .env to enable answer generation.")
        elif not results:
            st.info("No evidence retrieved, so no answer is generated.")
        elif st.button("Generate structured answer"):
            answer = generate_answer(query, results, api_key)
            st.write(answer.answer)
            st.markdown("**Citations:** " + (", ".join(answer.trial_citations) or "none"))
            for span in answer.evidence_spans:
                st.markdown(f"> {span.quote}\n>\n> {span.nct_id}")
            for title, items in (("Limitations", answer.limitations), ("Next questions", answer.next_questions)):
                if items:
                    st.markdown(f"**{title}**\n" + "\n".join(f"- {item}" for item in items))
            st.warning("Clinical review required before acting on this answer.")

with tabs[4]:
    st.caption("Synthetic patients. Findings are per criterion; for an exclusion, 'met' means the exclusion applies. Unknown is never counted as a match.")
    patient_ids = [p["id"] for p in json.loads(match.PATIENTS_PATH.read_text())]
    # Demo grants only: real identity and grants must come from the signed-in session once an API fronts this.
    grants = {"clinician-demo": set(patient_ids), "unassigned-demo": set()}
    a, b, c, d = st.columns([1, 2, 1, 1])
    user = a.selectbox("Acting as", list(grants))
    patient_id = b.selectbox("Patient", patient_ids)
    k = c.slider("Trials to assess", 1, 10, 5)
    jev_threshold = d.slider("Jev confidence threshold", 0.5, 0.99, 0.9, 0.01)
    if st.button("Match patient to trials"):
        try:
            st.session_state["match"] = match.match_patient(index, embed, user, patient_id, grants, k=k, rerank=reranker() if use_reranker else None)
        except PermissionError as error:
            st.session_state.pop("match", None)
            st.error(f"Access denied and logged: {error}")
    if "match" in st.session_state:
        facts, matches = st.session_state["match"]
        st.markdown(f"**{facts.patient_id}: facts used (no identifiers sent anywhere):** " + " · ".join(match.fact_lines(facts)))
        for n, result in enumerate(matches):
            with st.expander(f"{result.score}% · {result.trial_id} · {result.overall_assessment} · {result.title}"):
                b = result.breakdown
                st.caption(f"Score {result.score}%: {b['satisfied']} satisfied, {b['blocking']} blocking, {b['unknown']} unknown of {b['satisfied'] + b['blocking'] + b['unknown']} applicable criteria; "
                           f"{b['not_applicable']} not applicable. Unknown never counts as satisfied, and any blocking criterion cuts the score to a fifth. "
                           "This is a share of criteria, not a probability of eligibility. Review required.")
                st.markdown(f"[{result.source_url}]({result.source_url}) · registry data as of {result.last_verified}")
                st.dataframe([{"kind": f.kind, "status": f.status, "criterion": f.criterion, "patient_evidence": f.patient_evidence, "judged_by": f.judged_by, "confidence": f.confidence, "note": f.decision_note} for f in result.criteria], width="stretch")
                if result.missing_information:
                    st.markdown("**Information needed to assess**\n" + "\n".join(f"- {item}" for item in result.missing_information))
                    if os.getenv("GOOGLE_API_KEY") and st.button("Judge undecided criteria with Gemini", key=f"judge-{result.trial_id}", help="Sends the facts above and these criteria to Google. Use only with synthetic or consented data."):
                        matches[n] = match.judge_with_llm(result, facts, index.records[result.trial_id], os.environ["GOOGLE_API_KEY"])
                        st.rerun()
                    if not os.getenv("TYPESAFE_API_KEY"):
                        st.caption("Set TYPESAFE_API_KEY to enable the selective Jev layer.")
                    elif st.button("Selective judge: Jev for bounded criteria, Gemini for the rest", key=f"decide-{result.trial_id}", help="Sends the facts above and these criteria to TypeSafe and Google. Use only with synthetic or consented data."):
                        config = decide.DecisionConfig(threshold=jev_threshold)
                        matches[n] = decide.decide(result, facts, index.records[result.trial_id], os.environ["TYPESAFE_API_KEY"], os.getenv("GOOGLE_API_KEY"), config)
                        st.rerun()
        export = [{**m.model_dump(mode="json"), "criteria": [{**f.model_dump(mode="json"), "clinician_label": None} for f in m.criteria]} for m in matches]
        st.download_button("Download for clinician adjudication (JSON)", json.dumps(export, indent=2), file_name=f"adjudication-{facts.patient_id}.json")
        st.warning("Not an eligibility decision. A clinician must review every criterion against the current registry record.")

with tabs[5]:
    st.caption("Structural smoke checks and side-by-side variants. These are not recall or precision numbers; those need a labelled gold set.")
    if st.button("Run smoke checks"):
        st.dataframe(smoke_checks(index, embed), width="stretch")
    if st.button("Compare retrieval variants on the fixed query set"):
        rows = []
        for q in FIXED_QUERIES:
            tops = {m: [r["nct_id"] for r in search(index, parse_query(q, places), q, embed, mode=m, final_k=5)["results"]] for m in ("dense", "bm25", "hybrid")}
            rows.append({"query": q, **{m: ", ".join(ids) for m, ids in tops.items()}, "dense∩bm25": len(set(tops["dense"]) & set(tops["bm25"]))})
        st.dataframe(rows, width="stretch")

with tabs[6]:
    a, b, c, d = st.columns(4)
    a.metric("Trials", f"{len(index.records):,}")
    b.metric("Chunks", f"{len(index.chunks):,}")
    c.metric("Snapshot age", f"{age_days} d")
    d.metric("Build status", manifest["build_status"])
    st.caption(f"Raw {manifest['raw_count']} · unique {manifest['unique_count']} · accepted {manifest['accepted_count']} · rejected {manifest['rejected_count']} · embedding {manifest['embedding_model']} · registry data timestamp {manifest['data_timestamp']}")
    st.json(manifest, expanded=False)
