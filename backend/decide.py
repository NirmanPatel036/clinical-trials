"""Selective decision layer: rules first, Jev for bounded decisions, an LLM judge (Gemini or Groq) for what Jev should not decide."""
# Numeric and date criteria go to Jev like any other; only age, sex and ECOG are decided by rules in match.py.

import hashlib
import re
import time
from dataclasses import dataclass
from pathlib import Path

import requests

from .ingest import DATA_DIR
from .match import Judgement, apply_judgements, audit, fact_lines, judge_with_llm, summarise, undecided
from .schema import CriterionFinding, MatchResult, PatientFacts, TrialRecord

JEV_URL = "https://api.typesafe.ai/v1/systemone"
JEV_MAX_OPTIONS = 255
_NUMERIC_OR_DATE = re.compile(
    r"(?:[<>≤≥=]|\b(?:at least|at most|more than|less than|greater than|lower than|higher than|no more than|above|below|over|under|between"
    r"|exceed\w*|up to|within|last|past|prior|previous)\b)[^.;\n]{0,25}?\d"
    r"|\d\s*(?:-|–|to|and)\s*\d"
    r"|\d+(?:\.\d+)?\s*(?:%|x\s*uln|mg|g/dl|ml|mm|cm|kg|/\s*[uµm]?l|(?:\w+\s+)?(?:days?|weeks?|months?|years?|hours?))\b"
    r"|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|twelve)\s+(?:\w+\s+)?(?:days?|weeks?|months?|years?|hours?)\b"
    r"|\b(?:within|during|in) the (?:last|past|previous)\b",
    re.I,
)
# ponytail: keyword list for safety-critical criteria; replace with a clinician-reviewed list before a pilot.
_HIGH_RISK = re.compile(
    r"pregnan|lactat|breast-?feed|nursing|contracepti|childbearing|allerg|hypersensitiv|anaphyla|cardiac|heart failure|\bqtc?\b|arrhythm"
    r"|renal|kidney|hepatic|liver|\bhiv\b|hepatitis|seizure|suicid|bleeding|transplant|immunodeficien|(?:brain|cns) metasta|organ function",
    re.I,
)
_AMBIGUOUS = re.compile(r"\b(?:unless|except|either|and/or|whichever|otherwise|provided that)\b", re.I)


@dataclass(frozen=True)
class DecisionConfig:
    threshold: float = 0.9  # minimum Jev confidence to accept a decision or an evidence pick
    conflict: float = 0.25  # met and not_met both at least this likely -> contradictory
    model: str = "jev-latest"


def is_numeric_or_temporal(criterion: str) -> bool:
    return bool(_NUMERIC_OR_DATE.search(criterion))


def triage(criterion: str) -> str | None:
    """Why a criterion must skip Jev, or None when a bounded decision is appropriate."""
    if _HIGH_RISK.search(criterion):
        return "high_risk"
    if _AMBIGUOUS.search(criterion) or len(criterion) > 240:
        return "ambiguous"
    return None


def jev_request(state, questions: dict, api_key: str, model: str = "jev-latest", attempts: int = 3) -> dict:
    """One SystemOne call; 429 and 529 are retried with exponential backoff as the API reference asks."""
    for attempt in range(attempts):
        response = requests.post(JEV_URL, headers={"Authorization": f"Bearer {api_key}"}, json={"model": model, "state": state, "questions": questions}, timeout=30)
        if response.status_code not in (429, 529) or attempt == attempts - 1:
            break
        time.sleep(2**attempt)
    response.raise_for_status()
    return response.json()


def _jev_decide(finding: CriterionFinding, facts: PatientFacts, record: TrialRecord, api_key: str, config: DecisionConfig):
    """Returns (finding, escalation_reason, telemetry). A reason of None means the finding is final."""
    options = {f"f{i}": line for i, line in enumerate(fact_lines(facts))}
    answers = jev_request(
        {"patient_facts": list(options.values()), "criterion": finding.criterion, "kind": finding.kind},
        {
            "status": {
                "type": "choice",
                "instructions": "Judged only from patient_facts, is the criterion's statement true of the patient?",
                "criteria": {"met": "The facts explicitly show the statement is true", "not_met": "The facts explicitly contradict the statement", "unknown": "The facts do not say",
                             "not_applicable": "The criterion cannot apply to this patient at all, such as a pregnancy rule for a male patient"},
            },
            "evidence": {"type": "choice", "instructions": "Which single fact line decides the criterion?", "criteria": {**options, "none": "No fact line decides it"}},
        },
        api_key,
        config.model,
    )
    status, evidence = answers["answers"]["status"], answers["answers"]["evidence"]
    confidence, p = status["confidence"], status["probabilities"]
    telemetry = {"jev_choice": status["choice"], "confidence": confidence, **answers.get("usage", {})}
    seen = finding.model_copy(update={"judged_by": "jev", "confidence": confidence})
    if min(p.get("met", 0), p.get("not_met", 0)) >= config.conflict:
        return seen.model_copy(update={"decision_note": "contradictory"}), None, telemetry
    if confidence < config.threshold:
        return finding, "low_confidence", telemetry
    if status["choice"] == "unknown":
        return seen, None, telemetry
    if evidence["choice"] == "none":
        return seen.model_copy(update={"decision_note": "evidence_missing"}), None, telemetry
    if evidence["confidence"] < config.threshold:
        return finding, "evidence_uncertain", telemetry
    # The existing validator is the gate: it accepts only a verbatim fact line.
    judgement = Judgement(index=0, status=status["choice"], patient_evidence=options.get(evidence["choice"]))
    validated = apply_judgements(summarise(record, [finding], ""), [judgement], facts, record).criteria[0]
    if validated.status != status["choice"]:
        return seen.model_copy(update={"decision_note": "evidence_invalid"}), None, telemetry
    return validated.model_copy(update={"judged_by": "jev", "confidence": confidence}), None, telemetry


def decide(result: MatchResult, facts: PatientFacts, record: TrialRecord, jev_key: str, judge_key: str | None = None,
           config: DecisionConfig = DecisionConfig(), data_dir: Path = DATA_DIR, judge_provider: str = "gemini") -> MatchResult:
    """Judge the undecided criteria. Rule findings are never revisited. Escalations go to judge_provider with judge_key."""
    findings = list(result.criteria)
    escalated, leaning, events = {}, {}, {}
    # Jev's choice question takes a bounded number of options, one per fact line plus "none".
    too_long = len(fact_lines(facts)) >= JEV_MAX_OPTIONS
    for i, finding in enumerate(findings):
        if not undecided(finding):
            continue
        reason, started = triage(finding.criterion) or ("unsuitable" if too_long else None), time.perf_counter()
        events[i] = {"route": "none", "reason": reason, "confidence": None, "latency_ms": None}
        if reason is None:
            findings[i], reason, telemetry = _jev_decide(finding, facts, record, jev_key, config)
            leaning[i] = telemetry["jev_choice"]
            events[i] = {"route": "jev", "reason": reason or findings[i].decision_note, "latency_ms": round((time.perf_counter() - started) * 1000), **telemetry}
        if reason:
            escalated[i] = reason
            findings[i] = findings[i].model_copy(update={"decision_note": reason if judge_key else f"{reason}; not escalated, no {judge_provider.capitalize()} key"})

    if escalated and judge_key:
        started = time.perf_counter()
        judged = judge_with_llm(summarise(record, [findings[i] for i in escalated], ""), facts, record, judge_key, provider=judge_provider).criteria
        latency = round((time.perf_counter() - started) * 1000)
        for (i, reason), verdict in zip(escalated.items(), judged):
            # Two judges pointing opposite ways is contradictory evidence, so the criterion stays unknown.
            if verdict.status != "unknown" and leaning.get(i, verdict.status) not in (verdict.status, "unknown"):
                findings[i] = findings[i].model_copy(update={"decision_note": f"{reason}; judges_disagree"})
            else:
                findings[i] = verdict.model_copy(update={"decision_note": reason})
            events[i] = {**events[i], "route": f"{events[i]['route']}+{judge_provider}".removeprefix("none+"), "reason": findings[i].decision_note, "latency_ms": (events[i]["latency_ms"] or 0) + latency}

    for i, event in events.items():
        # No patient id, facts or evidence text here; the criterion is logged as a hash of registry text.
        audit(data_dir, "decisions.jsonl", trial=record.nct_id, criterion=hashlib.sha256(findings[i].criterion.encode()).hexdigest()[:12],
              kind=findings[i].kind, status=findings[i].status, judged_by=findings[i].judged_by, numeric=is_numeric_or_temporal(findings[i].criterion),
              threshold=config.threshold, model=config.model, **event)
    return summarise(record, findings, result.last_verified)
