"""Section chunks with factual headers, stored as a versioned Chroma + BM25 index."""

import json
import os
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import chromadb
from rank_bm25 import BM25Okapi

from .ingest import DATA_DIR, load_records, sha256_file
from .schema import SCHEMA_VERSION, TrialRecord

EMBED_MODEL = "pritamdeka/S-PubMedBert-MS-MARCO"
INDEX_FORMAT = "1"
CHUNK_CHARS = 1200


class StaleIndexError(RuntimeError):
    pass


@dataclass
class Index:
    path: Path
    manifest: dict
    records: dict[str, TrialRecord]
    chunks: list[dict]
    bm25: BM25Okapi
    collection: object


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def bm25_tokens(chunk: dict, title: str, title_weight: int = 1, eligibility_weight: int = 1) -> list[str]:
    """Tokens for one chunk; weights above 1 repeat the trial title, and the body of eligibility chunks."""
    tokens = tokenize(chunk["text"]) + tokenize(title) * (title_weight - 1)
    if chunk["section"] in ("inclusion_criteria", "exclusion_criteria", "eligibility"):
        tokens += tokenize(chunk["text"].split("\n", 1)[-1]) * (eligibility_weight - 1)
    return tokens


def weighted_bm25(index: "Index", title_weight: int, eligibility_weight: int) -> BM25Okapi:
    return BM25Okapi([bm25_tokens(c, index.records[c["nct_id"]].title, title_weight, eligibility_weight) for c in index.chunks])


def st_embedder(model_name: str = EMBED_MODEL):
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(model_name)
    return lambda texts: model.encode(texts, normalize_embeddings=True, batch_size=32).tolist()


def _pack(lines: list[str]) -> list[str]:
    """Greedily join lines into bodies of about CHUNK_CHARS so no criterion is cut mid-sentence."""
    bodies, current = [], ""
    for line in lines:
        if current and len(current) + len(line) > CHUNK_CHARS:
            bodies.append(current)
            current = ""
        current = f"{current}\n{line}" if current else line
    return bodies + [current] if current else bodies


def make_chunks(record: TrialRecord) -> list[dict]:
    sites = dict.fromkeys(", ".join(filter(None, (l.city, l.state, l.country))) for l in record.locations)
    sections = {
        "overview": [
            record.title,
            record.brief_summary,
            f"Conditions: {', '.join(record.conditions)}",
            f"Interventions: {', '.join(record.interventions)}",
        ],
        "inclusion_criteria": record.inclusion,
        "exclusion_criteria": record.exclusion,
        # Only used when the criteria text had no Inclusion/Exclusion headers to split on.
        "eligibility": [] if record.inclusion or record.exclusion else record.eligibility_raw.splitlines(),
        "locations": ["; ".join(sites)[:CHUNK_CHARS]] if sites else [],
    }
    phases = "/".join(record.phases) or "phase not stated"
    chunks = []
    for section, lines in sections.items():
        for i, body in enumerate(_pack([line for line in lines if line.strip()])):
            header = (
                f"{record.nct_id} | {', '.join(record.conditions[:3])} | {phases} | {record.overall_status.lower()} | "
                f"section={section} | source=ClinicalTrials.gov | last_updated={record.last_update_post_date}"
            )
            chunks.append({"id": f"{record.nct_id}:{section}:{i}", "nct_id": record.nct_id, "section": section, "text": f"{header}\n{body}"})
    return chunks


def build_index(snapshot_meta: dict, embed, data_dir: Path = DATA_DIR, embedding_model: str = EMBED_MODEL) -> Path:
    """Write a new index version directory. It is not served until activate() points at it."""
    snapshot_id = snapshot_meta["snapshot_id"]
    records = load_records(snapshot_id, data_dir)
    version = f"{snapshot_id}-{datetime.now(timezone.utc).strftime('%H%M%S%f')}"
    path = data_dir / "indexes" / version
    path.mkdir(parents=True)
    chunks = [chunk for record in records.values() for chunk in make_chunks(record)]
    collection = chromadb.PersistentClient(str(path / "chroma")).create_collection("chunks", metadata={"hnsw:space": "cosine"})
    for start in range(0, len(chunks), 500):
        batch = chunks[start : start + 500]
        collection.add(
            ids=[c["id"] for c in batch],
            embeddings=embed([c["text"] for c in batch]),
            metadatas=[{"nct_id": c["nct_id"], "section": c["section"]} for c in batch],
        )
    (path / "chunks.jsonl").write_text("".join(json.dumps(c) + "\n" for c in chunks))
    manifest = {
        **snapshot_meta,
        "index_version": version,
        "index_format": INDEX_FORMAT,
        "embedding_model": embedding_model,
        "bm25": "rank_bm25.BM25Okapi, tokenizer [a-z0-9]+",
        "chunk_count": len(chunks),
        "built_at": datetime.now(timezone.utc).isoformat(),
        "build_status": "built_unverified",
    }
    (path / "manifest.json").write_text(json.dumps(manifest, indent=2))
    return path


def open_index(path: Path, data_dir: Path = DATA_DIR) -> Index:
    """Load an index version, refusing one that no longer matches its records or this code."""
    manifest = json.loads((path / "manifest.json").read_text())
    if (manifest["schema_version"], manifest["index_format"]) != (SCHEMA_VERSION, INDEX_FORMAT):
        raise StaleIndexError(f"{path.name} was built for schema {manifest['schema_version']}/format {manifest['index_format']}")
    records_file = data_dir / "normalized" / f"{manifest['snapshot_id']}.jsonl"
    if sha256_file(records_file) != manifest["records_sha256"]:
        raise StaleIndexError(f"{records_file.name} changed after {path.name} was built")
    chunks = [json.loads(line) for line in open(path / "chunks.jsonl")]
    collection = chromadb.PersistentClient(str(path / "chroma")).get_collection("chunks")
    if collection.count() != len(chunks) or len(chunks) != manifest["chunk_count"]:
        raise StaleIndexError(f"{path.name}: dense index, chunk file and manifest disagree on chunk count")
    return Index(path, manifest, load_records(manifest["snapshot_id"], data_dir), chunks, BM25Okapi([tokenize(c["text"]) for c in chunks]), collection)


def set_status(path: Path, status: str, checks: list[dict]) -> None:
    manifest = json.loads((path / "manifest.json").read_text())
    manifest.update(build_status=status, checks=checks)
    (path / "manifest.json").write_text(json.dumps(manifest, indent=2))


def activate(path: Path) -> None:
    """Atomically repoint ACTIVE; earlier version directories stay on disk for rollback."""
    if json.loads((path / "manifest.json").read_text())["build_status"] != "passed":
        raise StaleIndexError(f"{path.name} has not passed its checks")
    pointer = path.parent / "ACTIVE"
    pointer.with_suffix(".tmp").write_text(path.name)
    os.replace(pointer.with_suffix(".tmp"), pointer)


def load_active(data_dir: Path = DATA_DIR) -> Index:
    pointer = data_dir / "indexes" / "ACTIVE"
    if not pointer.exists():
        raise StaleIndexError("no active index; run `python -m backend.build`")
    return open_index(pointer.parent / pointer.read_text().strip(), data_dir)
