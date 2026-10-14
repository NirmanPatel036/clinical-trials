"""Deterministic lab comparisons: one named lab, one threshold, convertible units, a dated and recent result."""

import re
from datetime import date

from .schema import LabResult

# Without a window in the criterion, a result older than this decides nothing.
MAX_AGE_DAYS = 90
_COUNT = {"x109/l": 1, "109/l": 1, "k/ul": 1, "x103/ul": 1, "103/ul": 1, "x103/mm3": 1, "103/mm3": 1, "/ul": 1e-3, "/mm3": 1e-3}
# name -> (aliases, {unit: factor into the canonical unit}). Order matters: longer names are matched first.
LABS = {
    "hba1c": (r"hba1c|glycated ha?emoglobin|ha?emoglobin a1c", {"%": 1}),
    "hemoglobin": (r"ha?emoglobin|hgb|hb", {"g/dl": 1, "g/l": 0.1, "mmol/l": 1.611}),
    "platelets": (r"platelets?(?: count)?|plt", _COUNT),
    "anc": (r"absolute neutrophil count|neutrophils?(?: count)?|anc", _COUNT),
    "wbc": (r"white blood cells?(?: count)?|leu[kc]ocytes?(?: count)?|wbc", _COUNT),
    "creatinine clearance": (r"creatinine clearance|crcl", {"ml/min": 1}),
    "creatinine": (r"(?:serum )?creatinine", {"mg/dl": 1, "umol/l": 1 / 88.4}),
    "bilirubin": (r"(?:total )?bilirubin", {"mg/dl": 1, "umol/l": 1 / 17.1}),
    "ast": (r"aspartate aminotransferase|ast|sgot", {"u/l": 1, "iu/l": 1}),
    "alt": (r"alanine aminotransferase|alt|sgpt", {"u/l": 1, "iu/l": 1}),
    "albumin": (r"(?:serum )?albumin", {"g/dl": 1, "g/l": 0.1}),
}
_OPERATORS = [
    (r"≥|>\s*=|=\s*>|at least|no less than|not less than|greater than or equal to|minimum of", ">="),
    (r"≤|<\s*=|=\s*<|at most|no more than|not more than|less than or equal to|maximum of|up to", "<="),
    (r">|greater than|more than|above|over|exceeding", ">"),
    (r"<|less than|below|under", "<"),
]
_OPERATOR = "|".join(f"(?P<op{i}>{pattern})" for i, (pattern, _) in enumerate(_OPERATORS))
_THRESHOLD = re.compile(
    rf"(?:{_OPERATOR})\s*(?P<number>\d{{1,3}}(?:,\d{{3}})+|\d+(?:\.\d+)?)\s*"
    r"(?P<unit>(?:[x×]?\s*10\s*\^?\s*[\d⁹³]\s*)?(?:cells\s*)?/?\s*[a-zµμ%]+\d?(?:\s*/\s*[a-zµμ]+\d?)?)",
    re.I,
)
_WINDOW = re.compile(r"within (?:the )?(?:last |past |previous )?(\d+) (day|week|month)s?", re.I)
# Relative thresholds and alternatives need a reference range or a judgement we do not have.
_NOT_COMPARABLE = re.compile(r"uln|lln|upper limit|lower limit|normal|baseline|institution|\bor\b|\bif\b|unless|except", re.I)
_COMPARE = {">=": lambda v, t: v >= t, "<=": lambda v, t: v <= t, ">": lambda v, t: v > t, "<": lambda v, t: v < t}


def canonical(lab: str, value: float, unit: str) -> float | None:
    """The value in the lab's canonical unit, or None when the unit is not one we can convert."""
    key = unit.lower().translate(str.maketrans("µμ⁹³×", "uu93x")).replace("mcl", "ul").replace("cells", "").replace("^", "").replace(" ", "")
    factor = LABS[lab][1].get(key)
    return None if factor is None else value * factor


def lab_name(text: str) -> str | None:
    """The one lab a text names, or None when it names none or more than one."""
    found = []
    for name, (aliases, _) in LABS.items():
        match = re.search(rf"(?<![a-z0-9])(?:{aliases})(?![a-z0-9])", text, re.I)
        if match:
            found.append(name)
            text = text[: match.start()] + " " * len(match.group()) + text[match.end() :]
    return found[0] if len(found) == 1 else None


def lab_line(lab: LabResult) -> str:
    return f"lab: {lab.name} {lab.value:g} {lab.unit} ({lab.measured_at or 'undated'}, {lab.source or 'source not recorded'})"


def parse_lab_criterion(criterion: str) -> tuple[str, str, float, int | None] | None:
    """(lab, operator, threshold in canonical units, window in days) for a plain single-threshold line, else None."""
    lab = lab_name(criterion)
    thresholds = list(_THRESHOLD.finditer(criterion))
    if not lab or len(thresholds) != 1 or len(criterion) > 120 or _NOT_COMPARABLE.search(criterion):
        return None
    found = thresholds[0]
    window = _WINDOW.search(criterion)
    rest = _WINDOW.sub(" ", criterion[: found.start()] + criterion[found.end() :])
    threshold = canonical(lab, float(found["number"].replace(",", "")), found["unit"])
    # A second number means a second condition this parser has not read.
    if threshold is None or re.search(r"\d", re.sub(r"a1c", "", rest, flags=re.I)):
        return None
    operator = next(symbol for i, (_, symbol) in enumerate(_OPERATORS) if found[f"op{i}"])
    days = int(window[1]) * {"day": 1, "week": 7, "month": 30}[window[2].lower()] if window else None
    return lab, operator, threshold, days


def lab_finding(criterion: str, labs: list[LabResult], as_of: date) -> tuple[str, str | None] | None:
    """('met' | 'not_met' | 'unknown', evidence line) when the line is a lab threshold and the patient has that lab.

    'unknown' means a result exists but is undated, too old or in a unit we cannot convert: it must not be used.
    """
    parsed = parse_lab_criterion(criterion)
    if not parsed:
        return None
    lab, operator, threshold, window = parsed
    results = [r for r in labs if lab_name(r.name) == lab]
    if not results:
        return None
    usable = [r for r in results if r.measured_at and canonical(lab, r.value, r.unit) is not None and 0 <= (as_of - r.measured_at).days <= (window or MAX_AGE_DAYS)]
    if not usable:
        return "unknown", None
    latest = max(usable, key=lambda r: r.measured_at)
    return ("met" if _COMPARE[operator](canonical(lab, latest.value, latest.unit), threshold) else "not_met"), lab_line(latest)
