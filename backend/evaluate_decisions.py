"""Score Met / Not Met / Unknown decisions against TrialGPT's physician criterion annotations. See EVALUATION.md.

Patients here are synthetic case descriptions and the labels are a physician consensus formed while reviewing
GPT-4 output, so this measures agreement with that consensus, not clinical reliability.
"""

import argparse
import hashlib
import json
import random
import statistics
import tempfile
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import requests

from .decide import DecisionConfig, decide, is_numeric_or_temporal
from .ingest import DATA_DIR
from .match import assess, judge_with_llm
from .query_plan import parse_query
from .schema import PatientFacts, TrialRecord

URL = "https://huggingface.co/datasets/ncbi/TrialGPT-Criterion-Annotations/resolve/main/data/train-00000-of-00001.parquet"
MD5 = "188bfcfa30e6afd366c9333cb18d4887"
FILE = "public/trialgpt/criterion_annotations.parquet"
LABELS = {"included": "met", "not included": "not_met", "excluded": "met", "not excluded": "not_met", "not enough information": "unknown", "not applicable": "not_applicable"}
SYSTEMS = ("rule", "jev", "gemini", "selective")
CLASSES = ("met", "not_met", "unknown", "not_applicable")


def download(data_dir: Path = DATA_DIR) -> Path:
    path = data_dir / FILE
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(requests.get(URL, timeout=120).content)
    if hashlib.md5(path.read_bytes()).hexdigest() != MD5:
        raise RuntimeError(f"{path} does not match the recorded checksum")
    return path


def split_of(patient_id: str) -> str:
    """Patient-level split, so no patient appears on both sides. The dataset's own `training` flag is undocumented."""
    return "dev" if int(hashlib.sha256(patient_id.encode()).hexdigest(), 16) % 2 == 0 else "held_out"


def load_pairs(data_dir: Path = DATA_DIR) -> list[dict]:
    """One entry per patient-trial pair, each with its criteria and the mapped expert label."""
    import pandas as pd

    frame = pd.read_parquet(data_dir / FILE).dropna(subset=["criterion_text"])
    pairs = []
    for (patient, trial), rows in frame.groupby(["patient_id", "trial_id"], sort=True):
        sentences = [line.split(". ", 1)[-1].strip() for line in rows.iloc[0]["note"].split("\n") if line.strip()]
        criteria = [
            {"kind": r.criterion_type, "text": r.criterion_text.strip(), "expert": LABELS.get(r.expert_eligibility), "expert_sentences": json.loads(r.expert_sentences or "[]")}
            for r in rows.sort_values("criterion_type", ascending=False).itertuples()
        ]
        pairs.append({"patient": patient, "trial": trial, "title": rows.iloc[0]["trial_title"], "sentences": sentences, "criteria": criteria, "split": split_of(patient)})
    return pairs


def build(pair: dict):
    """Turn a pair into the facts, record and rule-assessed result the product code works on."""
    plan = parse_query(" ".join(pair["sentences"]))
    facts = PatientFacts(patient_id=pair["patient"], age=plan.age, sex=plan.sex, notes=pair["sentences"])
    record = TrialRecord(
        nct_id=pair["trial"], title=pair["title"] or "", overall_status="UNKNOWN", source_url="", source_snapshot_id="trialgpt", record_hash="", parser_version="eval",
        inclusion=[c["text"] for c in pair["criteria"] if c["kind"] == "inclusion"], exclusion=[c["text"] for c in pair["criteria"] if c["kind"] == "exclusion"],
    )
    return facts, record, assess(facts, record, "")


def run_system(system: str, pairs: list[dict], config: DecisionConfig, jev_key=None, gemini_key=None, gemini_pairs=None, seed=0) -> tuple[list[dict], str | None]:
    """One row per scored criterion, plus the Gemini error that ended escalation early, if any.

    gemini_pairs caps Gemini at one request for each of that many randomly chosen pairs; the rest stay Jev-only.
    """
    chosen = set(range(len(pairs)) if gemini_pairs is None else random.Random(seed).sample(range(len(pairs)), min(gemini_pairs, len(pairs))))
    rows, gemini_error = [], None
    for number, pair in enumerate(pairs):
        facts, record, result = build(pair)
        events, started = [], time.perf_counter()
        use_gemini = system == "selective" and number in chosen and gemini_error is None
        if system == "gemini":
            result = judge_with_llm(result, facts, record, gemini_key)
        elif system in ("jev", "selective"):
            with tempfile.TemporaryDirectory() as log_dir:
                try:
                    result = decide(result, facts, record, jev_key, gemini_key if use_gemini else None, config, Path(log_dir))
                except Exception as error:
                    if not use_gemini:
                        raise
                    # Most likely a Gemini quota error: keep the paid Jev work by redoing this pair without escalation.
                    gemini_error, use_gemini = repr(error)[:300], False
                    result = decide(result, facts, record, jev_key, None, config, Path(log_dir))
                log = Path(log_dir) / "decisions.jsonl"
                events = [json.loads(line) for line in log.read_text().splitlines()] if log.exists() else []
        seconds = time.perf_counter() - started
        # assess() puts the registry age and sex findings first; the dataset's criteria follow in order.
        findings = result.criteria[2:]
        undecided_by_rule = iter(events)
        for criterion, finding in zip(pair["criteria"], findings, strict=True):
            event = {} if finding.judged_by == "rule" else next(undecided_by_rule, {})
            evidence = pair["sentences"].index(finding.patient_evidence) if finding.patient_evidence in pair["sentences"] else None
            rows.append({
                "pair": number, "gemini_available": use_gemini, "split": pair["split"], "kind": criterion["kind"], "expert": criterion["expert"], "pred": finding.status, "judged_by": finding.judged_by,
                "numeric": is_numeric_or_temporal(criterion["text"]), "evidence_agrees": None if evidence is None else evidence in criterion["expert_sentences"],
                "pair_seconds": seconds, "chars": len(criterion["text"]) + sum(map(len, pair["sentences"])), **{k: event.get(k) for k in ("route", "reason", "jev_choice", "confidence", "latency_ms", "input_tokens", "output_tokens")},
            })
    return rows, gemini_error


def without_escalation(row: dict) -> dict:
    """The same Jev answer with any Gemini verdict removed: what a Jev-only layer would have returned."""
    return {**row, "pred": "unknown", "judged_by": "none", "evidence_agrees": None} if "gemini" in (row.get("route") or "") else row


def wilson(successes: int, n: int) -> list[float] | None:
    """95% interval for a proportion; small synthetic samples should never be read as a point estimate."""
    if not n:
        return None
    p, z = successes / n, 1.96
    centre, half = p + z * z / (2 * n), z * ((p * (1 - p) + z * z / (4 * n)) / n) ** 0.5
    return [round((centre - half) / (1 + z * z / n), 4), round((centre + half) / (1 + z * z / n), 4)]


def _ratio(a, b):
    return round(a / b, 4) if b else None


def _favours_patient(kind: str, status: str) -> bool:
    return (kind, status) in (("inclusion", "met"), ("exclusion", "not_met"))


def decision_metrics(rows: list[dict]) -> dict:
    n = len(rows)
    decided = [r for r in rows if r["pred"] != "unknown"]
    # Only a met / not met disagreement can include or exclude wrongly; "not applicable" is neutral either way.
    opposite = [r for r in decided if {r["pred"], r["expert"]} == {"met", "not_met"}]
    per_class = {}
    for label in CLASSES:
        tp = sum(r["pred"] == label == r["expert"] for r in rows)
        predicted, actual = sum(r["pred"] == label for r in rows), sum(r["expert"] == label for r in rows)
        per_class[label] = {"precision": _ratio(tp, predicted), "recall": _ratio(tp, actual), "f1": _ratio(2 * tp, predicted + actual), "support": actual}
    abstained = [r for r in rows if r["pred"] == "unknown"]
    return {
        "n": n,
        "accuracy": _ratio(sum(r["pred"] == r["expert"] for r in rows), n),
        "macro_f1": round(statistics.mean(c["f1"] or 0 for c in per_class.values()), 4) if n else None,
        "per_class": per_class,
        # A decision the expert contradicts: in the patient's favour (false inclusion) or against them (false exclusion).
        "false_inclusions": sum(_favours_patient(r["kind"], r["pred"]) for r in opposite),
        "false_exclusions": sum(not _favours_patient(r["kind"], r["pred"]) for r in opposite),
        "false_inclusion_rate_of_decided": _ratio(sum(_favours_patient(r["kind"], r["pred"]) for r in opposite), len(decided)),
        "false_exclusion_rate_of_decided": _ratio(sum(not _favours_patient(r["kind"], r["pred"]) for r in opposite), len(decided)),
        "decided_where_expert_said_unknown": sum(r["expert"] == "unknown" for r in decided),
        "accuracy_when_decided_ci95": wilson(sum(r["pred"] == r["expert"] for r in decided), len(decided)),
        "abstention": {
            "coverage": _ratio(len(decided), n),
            "accuracy_when_decided": _ratio(sum(r["pred"] == r["expert"] for r in decided), len(decided)),
            "abstention_rate": _ratio(len(abstained), n),
            "abstained_and_expert_unknown": sum(r["expert"] == "unknown" for r in abstained),
            "abstained_but_expert_decided": sum(r["expert"] != "unknown" for r in abstained),
        },
    }


def calibration(rows: list[dict], bins: int = 10) -> dict | None:
    """How well Jev's confidence predicts agreement with the expert, before any threshold is applied."""
    scored = [(r["confidence"], r["jev_choice"] == r["expert"]) for r in rows if r.get("jev_choice") and r.get("confidence") is not None]
    if not scored:
        return None
    ece = 0.0
    for b in range(bins):
        bucket = [(c, ok) for c, ok in scored if b / bins <= c < (b + 1) / bins or (b == bins - 1 and c == 1)]
        if bucket:
            ece += len(bucket) / len(scored) * abs(statistics.mean(c for c, _ in bucket) - statistics.mean(ok for _, ok in bucket))
    at = {}
    for threshold in (0.5, 0.7, 0.8, 0.9, 0.95, 0.99):
        kept = [ok for c, ok in scored if c >= threshold]
        at[str(threshold)] = {"coverage": _ratio(len(kept), len(scored)), "accuracy": _ratio(sum(kept), len(kept))}
    return {"n": len(scored), "expected_calibration_error": round(ece, 4), "brier": round(statistics.mean((c - ok) ** 2 for c, ok in scored), 4), "accuracy_by_threshold": at}


def operations(rows: list[dict], pairs: int, jev_usd_per_mtok=None, gemini_usd_per_mtok=None) -> dict:
    routed = [r for r in rows if r.get("route")]
    to_gemini = [r for r in routed if "gemini" in r["route"]]
    latencies = sorted(r["latency_ms"] for r in routed if r["latency_ms"] is not None)
    jev_tokens = sum((r["input_tokens"] or 0) + (r["output_tokens"] or 0) for r in routed)
    # Gemini usage is not returned by the existing judge, so this is a characters / 4 estimate of input only.
    gemini_tokens = sum(r["chars"] for r in to_gemini) // 4
    out = {
        "judged_by": dict(Counter(r["judged_by"] for r in rows)),
        "escalation_rate": _ratio(len(to_gemini), len(routed)),
        "escalation_reasons": dict(Counter((r["reason"] or "").split(";")[0] for r in to_gemini)),
        "latency_ms_per_criterion": {"median": statistics.median(latencies), "p95": latencies[int(len(latencies) * 0.95) - 1]} if latencies else None,
        "seconds_per_pair": round(statistics.mean(r["pair_seconds"] for r in rows), 3) if rows else None,
        "jev_requests": sum("jev" in r["route"] for r in routed), "jev_tokens": jev_tokens, "gemini_criteria": len(to_gemini), "gemini_input_tokens_estimated": gemini_tokens,
    }
    if jev_usd_per_mtok is not None and gemini_usd_per_mtok is not None:
        out["estimated_cost_usd"] = round(jev_tokens / 1e6 * jev_usd_per_mtok + gemini_tokens / 1e6 * gemini_usd_per_mtok, 4)
        out["estimated_cost_usd_per_pair"] = round(out["estimated_cost_usd"] / pairs, 5) if pairs else None
    return out


def report(rows: list[dict], pairs: int, **prices) -> dict:
    agree = [r["evidence_agrees"] for r in rows if r["evidence_agrees"] is not None]
    return {
        **decision_metrics(rows),
        "numeric_or_date_criteria": decision_metrics([r for r in rows if r["numeric"]]),
        "other_criteria": decision_metrics([r for r in rows if not r["numeric"]]),
        "evidence_sentence_agrees_with_expert": _ratio(sum(agree), len(agree)),
        "calibration": calibration(rows),
        "operations": operations(rows, pairs, **prices),
    }


def run(systems, split="dev", n_pairs=None, threshold=0.9, allow_api=False, jev_key=None, gemini_key=None, data_dir: Path = DATA_DIR, gemini_pairs=None, **prices) -> dict:
    paid = [s for s in systems if s != "rule"]
    if paid and not allow_api:
        raise PermissionError(f"{paid} call paid external APIs; pass --allow-api once that spend is authorised")
    pairs = [p for p in load_pairs(data_dir) if p["split"] == split][:n_pairs]
    out = {
        "created": datetime.now(timezone.utc).isoformat(), "dataset": "ncbi/TrialGPT-Criterion-Annotations", "split": split, "pairs": len(pairs), "threshold": threshold,
        "patients": "synthetic case descriptions",
        "note": "Agreement with a physician consensus on synthetic patients. Not evidence of clinical reliability.",
        "systems": {}, "rows": {},
    }
    for system in systems:
        if system == "jev" and "selective" in systems:
            continue
        rows, gemini_error = run_system(system, pairs, DecisionConfig(threshold=threshold), jev_key, gemini_key, gemini_pairs)
        out["rows"][system] = rows
        if system != "selective":
            out["systems"][system] = report(rows, len(pairs), **prices)
            continue
        # One pass serves both views, so Jev is never paid for twice.
        with_gemini = [r for r in rows if r["gemini_available"]]
        out["systems"]["selective"] = report(with_gemini, len({r["pair"] for r in with_gemini}), **prices)
        out["systems"]["jev"] = report([without_escalation(r) for r in rows], len(pairs), **prices)
        wants = Counter((r["reason"] or "").split(";")[0] for r in rows if r["judged_by"] != "rule")
        out["gemini"] = {"pairs_with_gemini": len({r["pair"] for r in with_gemini}), "stopped_by_error": gemini_error,
                         "criteria_needing_escalation_all_pairs": {k: v for k, v in wants.items() if k in ("high_risk", "ambiguous", "unsuitable", "low_confidence", "evidence_uncertain")},
                         "criteria_not_decided_by_rule": sum(wants.values())}
    return out


if __name__ == "__main__":
    import os

    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    parser = argparse.ArgumentParser()
    parser.add_argument("--systems", nargs="+", default=["rule"], choices=SYSTEMS)
    parser.add_argument("--split", default="dev", choices=["dev", "held_out"], help="tune on dev only; run held_out once, at the end")
    parser.add_argument("--n-pairs", type=int, help="limit the number of patient-trial pairs")
    parser.add_argument("--threshold", type=float, default=0.9)
    parser.add_argument("--allow-api", action="store_true", help="permit Jev and Gemini calls, which cost money")
    parser.add_argument("--gemini-pairs", type=int, help="selective only: cap Gemini at one request for each of N randomly chosen pairs")
    parser.add_argument("--download", action="store_true", help="fetch the dataset from Hugging Face if missing")
    parser.add_argument("--jev-usd-per-mtok", type=float)
    parser.add_argument("--gemini-usd-per-mtok", type=float)
    args = parser.parse_args()
    if args.download:
        download()
    result = run(args.systems, args.split, args.n_pairs, args.threshold, args.allow_api, os.getenv("TYPESAFE_API_KEY"), os.getenv("GOOGLE_API_KEY"),
                 gemini_pairs=args.gemini_pairs, jev_usd_per_mtok=args.jev_usd_per_mtok, gemini_usd_per_mtok=args.gemini_usd_per_mtok)
    out = DATA_DIR / "eval" / f"decisions-{args.split}-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    # Rows hold labels and telemetry only, no note text; they allow re-scoring without paying again.
    out.with_suffix(".rows.json").write_text(json.dumps(result.pop("rows")))
    out.write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))
    print(f"saved {out}")
