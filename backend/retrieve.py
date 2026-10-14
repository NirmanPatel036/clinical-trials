"""Hard filters, dense + BM25 retrieval, reciprocal-rank fusion, optional reranking."""

from collections import defaultdict

from .index import Index, tokenize
from .schema import QueryPlan, Sex, TrialRecord


def allowed_ids(plan: QueryPlan, records: dict[str, TrialRecord]) -> set[str] | None:
    """Trials passing every hard constraint. None = no constraint given; empty set = nothing qualifies."""
    sex = plan.sex if plan.sex != Sex.ALL else None
    if not (plan.trial_ids or plan.status or plan.phase or sex or plan.age is not None or plan.location):
        return None
    # ponytail: linear scan + $in list, fine to ~20k trials; move filters into Chroma metadata beyond that.
    allowed = set()
    for r in records.values():
        if plan.trial_ids and r.nct_id not in plan.trial_ids:
            continue
        if plan.status and r.overall_status not in plan.status:
            continue
        if plan.phase and not set(plan.phase) & set(r.phases):
            continue
        if sex and r.sex not in (sex, Sex.ALL):
            continue
        # A missing bound is the registry's way of saying "no limit", not missing data.
        if plan.age is not None and not (r.minimum_age or 0) <= plan.age <= (r.maximum_age if r.maximum_age is not None else 999):
            continue
        if plan.location and not any(plan.location in (l.city.casefold(), l.state.casefold(), l.country.casefold()) for l in r.locations):
            continue
        allowed.add(r.nct_id)
    return allowed


def rrf(rankings: list[list[str]], k: int = 60) -> list[tuple[str, float]]:
    scores = defaultdict(float)
    for ranking in rankings:
        for rank, item in enumerate(ranking, 1):
            scores[item] += 1 / (k + rank)
    return sorted(scores.items(), key=lambda pair: -pair[1])


def search(index: Index, plan: QueryPlan, query: str, embed, mode="hybrid", top_n=100, final_k=10, rerank=None, lexical=None) -> dict:
    """mode is dense | bm25 | hybrid; lexical swaps in another BM25 index. Errors propagate; an empty filter result is returned as empty."""
    allowed = allowed_ids(plan, index.records)
    trace = {"allowed_trials": None if allowed is None else len(allowed), "dense": [], "bm25": [], "results": []}
    if allowed is not None and not allowed:
        return trace

    if mode != "bm25":
        where = None if allowed is None else {"nct_id": {"$in": sorted(allowed)}}
        hits = index.collection.query(query_embeddings=embed([query]), n_results=min(top_n, len(index.chunks)), where=where, include=["distances"])
        trace["dense"] = list(zip(hits["ids"][0], hits["distances"][0]))
    if mode != "dense":
        scores = (lexical or index.bm25).get_scores(tokenize(query))
        order = [i for i, c in enumerate(index.chunks) if scores[i] > 0 and (allowed is None or c["nct_id"] in allowed)]
        order = sorted(order, key=lambda i: -scores[i])[:top_n]
        trace["bm25"] = [(index.chunks[i]["id"], float(scores[i])) for i in order]

    text = {c["id"]: c["text"] for c in index.chunks}
    dense, bm25 = dict(trace["dense"]), dict(trace["bm25"])
    trials = {}
    for chunk_id, score in rrf([list(dense), list(bm25)]):
        nct_id = chunk_id.split(":")[0]
        trial = trials.setdefault(nct_id, {"nct_id": nct_id, "fused_rank": len(trials) + 1, "rrf_score": score, "rerank_score": None, "chunks": []})
        if len(trial["chunks"]) < 3:
            trial["chunks"].append({"id": chunk_id, "text": text[chunk_id], "dense_distance": dense.get(chunk_id), "bm25_score": bm25.get(chunk_id)})
    results = list(trials.values())

    if rerank and results:
        pool = results[: max(50, final_k)]
        for trial, score in zip(pool, rerank(query, [t["chunks"][0]["text"] for t in pool])):
            trial["rerank_score"] = float(score)
        results = sorted(pool, key=lambda t: -t["rerank_score"])
    trace["results"] = results[:final_k]
    return trace
