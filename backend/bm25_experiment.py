"""Does weighting titles and eligibility text in BM25 help? Run: python -m backend.bm25_experiment

There is no relevance-labelled query set for this index, so this is a known-item proxy: each query is built
from one trial and the question is where that trial ranks. It can suggest a direction, not prove a gain.
"""

import json
import random

from .index import load_active, weighted_bm25
from .retrieve import search
from .schema import QueryPlan

VARIANTS = [(1, 1), (3, 1), (1, 2), (3, 2), (5, 3)]


def queries(index, n: int, seed: int) -> dict[str, list[tuple[str, str]]]:
    """Three query styles per sampled trial: its condition and drug fields, one inclusion criterion, and its title."""
    rng = random.Random(seed)
    sample = rng.sample(sorted(index.records), min(n, len(index.records)))
    out = {"conditions + interventions": [], "one inclusion criterion": [], "title (favours title weight by construction)": []}
    for nct_id in sample:
        record = index.records[nct_id]
        long_lines = [line for line in record.inclusion if len(line) >= 40]
        out["conditions + interventions"].append((nct_id, " ".join(record.conditions[:2] + record.interventions[:2])))
        if long_lines:
            out["one inclusion criterion"].append((nct_id, rng.choice(long_lines)))
        out["title (favours title weight by construction)"].append((nct_id, record.title))
    return out


def run(index, n: int = 300, seed: int = 0) -> list[dict]:
    rows = []
    for title_weight, eligibility_weight in VARIANTS:
        lexical = weighted_bm25(index, title_weight, eligibility_weight)
        for style, items in queries(index, n, seed).items():
            ranks = []
            for nct_id, text in items:
                found = [r["nct_id"] for r in search(index, QueryPlan(), text, None, mode="bm25", final_k=10, lexical=lexical)["results"]]
                ranks.append(found.index(nct_id) + 1 if nct_id in found else None)
            rows.append({
                "title_weight": title_weight, "eligibility_weight": eligibility_weight, "query_style": style, "queries": len(ranks),
                "recall_at_1": round(sum(r == 1 for r in ranks) / len(ranks), 3), "recall_at_10": round(sum(r is not None for r in ranks) / len(ranks), 3),
                "mrr_at_10": round(sum(1 / r for r in ranks if r) / len(ranks), 3),
            })
    return rows


if __name__ == "__main__":
    print(json.dumps(run(load_active()), indent=1))
