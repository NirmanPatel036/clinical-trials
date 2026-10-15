"""ClinicalTrials.gov API v2 -> immutable raw snapshot -> normalized TrialRecords."""

import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
from pydantic import ValidationError

from .query_plan import find_biomarkers
from .schema import SCHEMA_VERSION, Location, TrialRecord

API = "https://clinicaltrials.gov/api/v2"
PARSER_VERSION = "1"
# Snapshots, records and index versions. A deployment points this at a persistent disk or a copied index.
DATA_DIR = Path(os.getenv("ORVANT_DATA_DIR") or Path(__file__).parent / "data")
CONDITIONS = [
    "breast cancer", "lung cancer", "melanoma", "colorectal cancer",
    "prostate cancer", "pancreatic cancer", "leukemia", "ovarian cancer",
]
_YEAR_FRACTION = {"year": 1, "month": 12, "week": 52, "day": 365, "hour": 8760, "minute": 525600}


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fetch_snapshot(data_dir: Path = DATA_DIR, conditions=CONDITIONS, per_condition=250, statuses=("RECRUITING",)) -> str:
    """Download studies into a new raw/<snapshot_id>/ directory and return the id."""
    api_version = requests.get(f"{API}/version", timeout=30).json()
    snapshot_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out = data_dir / "raw" / snapshot_id
    out.mkdir(parents=True)
    total = 0
    with open(out / "studies.jsonl", "w") as f:
        for condition in conditions:
            got, token = 0, None
            while got < per_condition:
                params = {
                    "query.cond": condition,
                    "filter.overallStatus": ",".join(statuses),
                    "pageSize": min(100, per_condition - got),
                }
                if token:
                    params["pageToken"] = token
                response = requests.get(f"{API}/studies", params=params, timeout=60)
                response.raise_for_status()
                page = response.json()
                for study in page.get("studies", []):
                    f.write(json.dumps(study) + "\n")
                    got += 1
                token = page.get("nextPageToken")
                if not token:
                    break
            total += got
    meta = {
        "snapshot_id": snapshot_id,
        "api_version": api_version.get("apiVersion"),
        "data_timestamp": api_version.get("dataTimestamp"),
        "ingested_at": datetime.now(timezone.utc).isoformat(),
        "query": {"conditions": list(conditions), "per_condition": per_condition, "statuses": list(statuses)},
        "raw_count": total,
        "raw_sha256": sha256_file(out / "studies.jsonl"),
    }
    (out / "meta.json").write_text(json.dumps(meta, indent=2))
    return snapshot_id


def parse_age(value: str | None) -> float | None:
    """'18 Years' -> 18.0, '6 Months' -> 0.5, missing -> None."""
    match = re.match(r"\s*(\d+)\s*(year|month|week|day|hour|minute)", value or "", re.I)
    return int(match[1]) / _YEAR_FRACTION[match[2].lower()] if match else None


def _criteria_lines(block: str) -> list[str]:
    lines = (re.sub(r"^\s*(?:[*\-•]|\d+[.)])\s*", "", line).strip() for line in block.splitlines())
    return [line for line in lines if line]


def split_criteria(text: str) -> tuple[list[str], list[str]]:
    """Split on the first Inclusion/Exclusion headers; ([], []) when the text has no such layout."""
    # ponytail: first header pair only; multi-cohort criteria blocks need a real parser (Phase 2).
    inclusion = re.search(r"inclusion criteria\s*:?", text, re.I)
    exclusion = re.search(r"exclusion criteria\s*:?", text, re.I)
    if not (inclusion and exclusion and inclusion.start() < exclusion.start()):
        return [], []
    return _criteria_lines(text[inclusion.end() : exclusion.start()]), _criteria_lines(text[exclusion.end() :])


def normalize(study: dict, snapshot_id: str) -> TrialRecord:
    """Raises ValidationError when the study does not fit the schema."""
    protocol = study.get("protocolSection", {})
    ident = protocol.get("identificationModule", {})
    status = protocol.get("statusModule", {})
    eligibility = protocol.get("eligibilityModule", {})
    criteria = eligibility.get("eligibilityCriteria", "")
    inclusion, exclusion = split_criteria(criteria)
    nct_id = ident.get("nctId", "")
    return TrialRecord(
        nct_id=nct_id,
        title=ident.get("briefTitle", ""),
        official_title=ident.get("officialTitle", ""),
        brief_summary=protocol.get("descriptionModule", {}).get("briefSummary", ""),
        overall_status=status.get("overallStatus", ""),
        phases=protocol.get("designModule", {}).get("phases", []),
        conditions=protocol.get("conditionsModule", {}).get("conditions", []),
        interventions=[i.get("name", "") for i in protocol.get("armsInterventionsModule", {}).get("interventions", [])],
        eligibility_raw=criteria,
        minimum_age=parse_age(eligibility.get("minimumAge")),
        maximum_age=parse_age(eligibility.get("maximumAge")),
        sex=eligibility.get("sex", "ALL"),
        inclusion=inclusion,
        exclusion=exclusion,
        biomarkers=find_biomarkers(" ".join([ident.get("briefTitle", ""), criteria])),
        locations=[
            Location(**{k: loc.get(k) or "" for k in ("facility", "city", "state", "country")})
            for loc in protocol.get("contactsLocationsModule", {}).get("locations", [])
        ],
        last_update_post_date=status.get("lastUpdatePostDateStruct", {}).get("date"),
        source_url=f"https://clinicaltrials.gov/study/{nct_id}",
        source_snapshot_id=snapshot_id,
        record_hash=hashlib.sha256(json.dumps(study, sort_keys=True).encode()).hexdigest(),
        parser_version=PARSER_VERSION,
    )


def normalize_snapshot(snapshot_id: str, data_dir: Path = DATA_DIR) -> dict:
    """Write normalized/<snapshot_id>.jsonl (deduplicated by NCT ID) and return the counts."""
    raw_dir = data_dir / "raw" / snapshot_id
    records, rejected, seen, raw = {}, {}, set(), 0
    for line in open(raw_dir / "studies.jsonl"):
        raw += 1
        study = json.loads(line)
        nct_id = study.get("protocolSection", {}).get("identificationModule", {}).get("nctId")
        seen.add(nct_id)
        try:
            records.setdefault(nct_id, normalize(study, snapshot_id))
        except ValidationError as error:
            rejected[nct_id] = f"{error.errors()[0]['loc']}: {error.errors()[0]['msg']}"
    out = data_dir / "normalized" / f"{snapshot_id}.jsonl"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("".join(record.model_dump_json() + "\n" for record in records.values()))
    return {
        **json.loads((raw_dir / "meta.json").read_text()),
        "schema_version": SCHEMA_VERSION,
        "parser_version": PARSER_VERSION,
        "raw_count": raw,
        "unique_count": len(seen),
        "accepted_count": len(records),
        "rejected_count": len(rejected),
        "rejected": dict(list(rejected.items())[:50]),
        "records_sha256": sha256_file(out),
    }


def load_records(snapshot_id: str, data_dir: Path = DATA_DIR) -> dict[str, TrialRecord]:
    path = data_dir / "normalized" / f"{snapshot_id}.jsonl"
    return {r.nct_id: r for r in map(TrialRecord.model_validate_json, open(path))}
