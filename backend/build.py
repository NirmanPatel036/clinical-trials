"""Fetch -> normalize -> index -> smoke checks -> activate. Run: python -m backend.build"""

import argparse
from pathlib import Path

from .index import EMBED_MODEL, Index, activate, build_index, open_index, set_status, st_embedder
from .ingest import DATA_DIR, fetch_snapshot, normalize_snapshot
from .query_plan import parse_query
from .retrieve import search
from .schema import Phase, QueryPlan, Sex, Status


def smoke_checks(index: Index, embed, sample: int = 5) -> list[dict]:
    """Structural checks, not quality metrics: counts, exact-ID lookup and filter correctness."""
    records = index.records
    checks = [{"check": "every trial has chunks", "passed": {c["nct_id"] for c in index.chunks} == set(records), "detail": f"{len(records)} trials, {len(index.chunks)} chunks"}]
    for nct_id in sorted(records)[:: max(1, len(records) // sample)][:sample]:
        top = [r["nct_id"] for r in search(index, QueryPlan(), nct_id, embed, mode="bm25", final_k=1)["results"]]
        checks.append({"check": f"BM25 finds {nct_id} by ID", "passed": top == [nct_id], "detail": str(top)})
        top = [r["nct_id"] for r in search(index, parse_query(f"tell me about {nct_id}"), nct_id, embed)["results"]]
        checks.append({"check": f"planned query returns only {nct_id}", "passed": top == [nct_id], "detail": str(top)})
    filters = {
        "status=RECRUITING phase=PHASE3": (QueryPlan(status=[Status.RECRUITING], phase=[Phase.PHASE3]), lambda r: r.overall_status == Status.RECRUITING and Phase.PHASE3 in r.phases),
        "sex=FEMALE": (QueryPlan(sex=Sex.FEMALE), lambda r: r.sex in (Sex.FEMALE, Sex.ALL)),
        "age=10": (QueryPlan(age=10), lambda r: (r.minimum_age or 0) <= 10 <= (r.maximum_age if r.maximum_age is not None else 999)),
    }
    for name, (plan, holds) in filters.items():
        got = [r["nct_id"] for r in search(index, plan, "cancer treatment", embed, final_k=20)["results"]]
        bad = [nct_id for nct_id in got if not holds(records[nct_id])]
        checks.append({"check": f"filter {name} holds for every result", "passed": not bad, "detail": f"{len(got)} results, {len(bad)} violations"})
    return checks


def run(data_dir: Path = DATA_DIR, per_condition: int = 250, snapshot_id: str | None = None, embed=None, **fetch_args) -> Path:
    embed = embed or st_embedder()
    snapshot_id = snapshot_id or fetch_snapshot(data_dir, per_condition=per_condition, **fetch_args)
    meta = normalize_snapshot(snapshot_id, data_dir)
    path = build_index(meta, embed, data_dir, EMBED_MODEL)
    checks = smoke_checks(open_index(path, data_dir), embed)
    passed = all(c["passed"] for c in checks)
    set_status(path, "passed" if passed else "failed", checks)
    if not passed:
        raise RuntimeError(f"index {path.name} failed checks and was not activated: {[c for c in checks if not c['passed']]}")
    activate(path)
    return path


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--per-condition", type=int, default=250)
    parser.add_argument("--snapshot", help="reuse an existing raw snapshot id instead of fetching")
    args = parser.parse_args()
    built = run(per_condition=args.per_condition, snapshot_id=args.snapshot)
    print(f"active index: {built.name}")
