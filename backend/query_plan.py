"""Deterministic parsing of a free-text query into a validated QueryPlan."""

import re

from .schema import Phase, QueryPlan, Sex, Status

# ponytail: keyword lists, not a terminology service; move to SNOMED/HGNC mapping when coverage matters.
_BIOMARKERS = {
    "HER2": r"her-?2", "EGFR": r"egfr", "ALK": r"alk", "BRAF": r"braf", "KRAS": r"kras",
    "PD-L1": r"pd-?l1", "BRCA": r"brca[12]?", "ROS1": r"ros-?1", "NTRK": r"ntrk", "MSI-H": r"msi-?h",
}
_CONDITIONS = {
    "breast cancer": r"breast", "lung cancer": r"lung|nsclc|sclc", "melanoma": r"melanoma",
    "colorectal cancer": r"colorectal|colon|rectal", "prostate cancer": r"prostate",
    "pancreatic cancer": r"pancreas|pancreatic", "leukemia": r"leuka?emia|aml|cll|cml",
    "ovarian cancer": r"ovarian|ovary",
}
# Longest phrases first; None marks wording that cannot be mapped safely.
_STATUS_PHRASES = [
    (r"active,?\s+not\s+recruiting", Status.ACTIVE_NOT_RECRUITING),
    (r"not\s+yet\s+recruiting", Status.NOT_YET_RECRUITING),
    (r"enrolling\s+by\s+invitation", Status.ENROLLING_BY_INVITATION),
    (r"not\s+recruiting", None),
    (r"recruiting", Status.RECRUITING),
    (r"completed", Status.COMPLETED),
    (r"terminated", Status.TERMINATED),
    (r"suspended", Status.SUSPENDED),
    (r"withdrawn", Status.WITHDRAWN),
    (r"active", None),
]
_ROMAN = {"i": 1, "ii": 2, "iii": 3, "iv": 4}
_NUM = r"(iv|i{1,3}|[1-4])"
_PHASE_RE = re.compile(rf"\b(early[\s-]+)?phase\s*{_NUM}[ab]?(?:\s*/\s*{_NUM}[ab]?)?\b", re.I)
_STAGE_RE = re.compile(rf"\bstage\s*{_NUM}([abc])?\b", re.I)
_AGE_RE = re.compile(r"\b(\d{1,3})[\s-]*(?:years?|yrs?)[\s-]*old\b|\b(\d{1,3})\s*y/?o\b|\baged?\s+(\d{1,3})\b", re.I)
_ALIASES = {"usa": "united states", "us": "united states", "uk": "united kingdom"}


def _word(pattern: str, text: str):
    return re.search(rf"(?<![a-z0-9])(?:{pattern})(?![a-z0-9])", text, re.I)


def _number(token: str) -> int:
    return int(token) if token.isdigit() else _ROMAN[token.lower()]


def find_biomarkers(text: str) -> list[str]:
    return [name for name, pattern in _BIOMARKERS.items() if _word(pattern, text)]


def find_phases(text: str) -> list[Phase]:
    phases = []
    for early, first, second in _PHASE_RE.findall(text):
        for token in filter(None, (first, second)):
            n = _number(token)
            phase = Phase.EARLY_PHASE1 if early and n == 1 else Phase(f"PHASE{n}")
            if phase not in phases:
                phases.append(phase)
    return phases


def canonical_stage(text: str) -> list[str]:
    """'stage 3b relapsed' -> ['IIIB', 'relapsed']."""
    stages = [["I", "II", "III", "IV"][_number(num) - 1] + sub.upper() for num, sub in _STAGE_RE.findall(text)]
    stages += [word for word in ("relapsed", "refractory") if _word(word, text)]
    return list(dict.fromkeys(stages))


def find_status(text: str) -> tuple[list[Status], list[str]]:
    statuses, unknowns = [], []
    for pattern, status in _STATUS_PHRASES:
        match = _word(pattern, text)
        if not match:
            continue
        text = text[: match.start()] + " " * len(match.group()) + text[match.end() :]
        if status:
            statuses.append(status)
        else:
            unknowns.append(f"status wording '{match.group()}' is ambiguous")
    return statuses, unknowns


def find_location(text: str, known: frozenset[str]) -> str | None:
    """Longest phrase after in/near/around that is a place present in the corpus."""
    for match in re.finditer(r"\b(?:in|near|around)\s+((?:[\w.'-]+\s*){1,3})", text, re.I):
        words = match.group(1).split()
        for n in range(len(words), 0, -1):
            candidate = " ".join(words[:n]).casefold().strip(".,")
            candidate = _ALIASES.get(candidate, candidate)
            if candidate in known:
                return candidate
    return None


def parse_query(text: str, known_locations: frozenset[str] = frozenset()) -> QueryPlan:
    trial_ids = list(dict.fromkeys(m.upper() for m in re.findall(r"\bNCT\d{8}\b", text, re.I)))
    status, unknowns = find_status(text)
    female = _word("women|woman|females?", text)
    male = _word("men|man|males?", text)
    age = next((int(g) for m in _AGE_RE.finditer(text) for g in m.groups() if g), None)
    if age is None and _word("children|child|pediatric|paediatric|elderly", text):
        unknowns.append("age group mentioned without a specific age")
    conditions = [name for name, pattern in _CONDITIONS.items() if _word(pattern, text)]
    biomarkers = find_biomarkers(text)

    if _word("pubmed|literature|papers?|publications?", text):
        intent = "literature"
    elif _word("eligible|eligibility|qualify|patient", text):
        intent = "patient_match"
    elif len(trial_ids) >= 2 and _word("compare|versus|vs", text):
        intent = "compare"
    elif trial_ids:
        intent = "detail"
    else:
        intent = "search"

    return QueryPlan(
        intent=intent,
        conditions=conditions,
        status=status,
        phase=find_phases(text),
        sex=Sex.FEMALE if female and not male else Sex.MALE if male and not female else None,
        age=age,
        location=find_location(text, known_locations),
        biomarkers=biomarkers,
        stage=canonical_stage(text),
        trial_ids=trial_ids,
        freshness_required=bool(_word("latest|current|currently|today|now", text)),
        unknowns=unknowns,
        needs_clarification=bool(unknowns) or not (conditions or biomarkers or trial_ids),
    )
