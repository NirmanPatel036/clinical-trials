"""Typed boundary shared by ingestion, indexing, query planning and answers."""

from datetime import date
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field

SCHEMA_VERSION = "1"


class Status(StrEnum):
    RECRUITING = "RECRUITING"
    NOT_YET_RECRUITING = "NOT_YET_RECRUITING"
    ENROLLING_BY_INVITATION = "ENROLLING_BY_INVITATION"
    ACTIVE_NOT_RECRUITING = "ACTIVE_NOT_RECRUITING"
    SUSPENDED = "SUSPENDED"
    TERMINATED = "TERMINATED"
    COMPLETED = "COMPLETED"
    WITHDRAWN = "WITHDRAWN"
    UNKNOWN = "UNKNOWN"
    AVAILABLE = "AVAILABLE"
    NO_LONGER_AVAILABLE = "NO_LONGER_AVAILABLE"
    TEMPORARILY_NOT_AVAILABLE = "TEMPORARILY_NOT_AVAILABLE"
    APPROVED_FOR_MARKETING = "APPROVED_FOR_MARKETING"
    WITHHELD = "WITHHELD"


class Phase(StrEnum):
    EARLY_PHASE1 = "EARLY_PHASE1"
    PHASE1 = "PHASE1"
    PHASE2 = "PHASE2"
    PHASE3 = "PHASE3"
    PHASE4 = "PHASE4"
    NA = "NA"


class Sex(StrEnum):
    ALL = "ALL"
    FEMALE = "FEMALE"
    MALE = "MALE"


class Location(BaseModel):
    facility: str = ""
    city: str = ""
    state: str = ""
    country: str = ""


class TrialRecord(BaseModel):
    nct_id: str = Field(pattern=r"^NCT\d{8}$")
    title: str
    official_title: str = ""
    brief_summary: str = ""
    overall_status: Status
    phases: list[Phase] = []
    conditions: list[str] = []
    interventions: list[str] = []
    eligibility_raw: str = ""
    # Ages in years; None means the registry states no limit.
    minimum_age: float | None = None
    maximum_age: float | None = None
    sex: Sex = Sex.ALL
    inclusion: list[str] = []
    exclusion: list[str] = []
    biomarkers: list[str] = []
    locations: list[Location] = []
    last_update_post_date: str | None = None
    source_url: str
    source_snapshot_id: str
    record_hash: str
    parser_version: str


class QueryPlan(BaseModel):
    intent: Literal["search", "detail", "compare", "patient_match", "literature"] = "search"
    conditions: list[str] = []
    status: list[Status] = []
    phase: list[Phase] = []
    sex: Sex | None = None
    age: int | None = None
    location: str | None = None
    biomarkers: list[str] = []
    stage: list[str] = []
    trial_ids: list[str] = []
    freshness_required: bool = False
    live_lookup_allowed: bool = False
    unknowns: list[str] = []
    needs_clarification: bool = False


class EvidenceSpan(BaseModel):
    nct_id: str
    quote: str


class LiteratureSpan(BaseModel):
    pmid: str
    quote: str


class Answer(BaseModel):
    answer: str
    trial_citations: list[str] = []
    evidence_spans: list[EvidenceSpan] = []
    # PubMed quotes are kept apart from registry quotes: published research, not trial facts.
    literature_spans: list[LiteratureSpan] = []
    limitations: list[str] = []
    next_questions: list[str] = []
    clinical_review_required: bool = True


class LabResult(BaseModel):
    name: str
    value: float
    unit: str
    measured_at: date | None = None
    source: str = ""


class PatientFacts(BaseModel):
    """Only the facts matching needs; no name, birth date or address."""

    patient_id: str
    age: int | None = None
    sex: Sex | None = None
    diagnosis: str | None = None
    stage: str | None = None
    # What the report says beyond the stage group: TNM, grade, high-risk features. Lets a judge settle "high-risk Stage II".
    stage_details: str | None = None
    disease_status: str | None = None
    biomarkers: list[str] = []
    ecog: int | None = None
    medications: list[str] = []
    procedures: list[str] = []
    labs: list[LabResult] = []
    # Free-text sentences, each usable verbatim as evidence.
    notes: list[str] = []


class CriterionFinding(BaseModel):
    criterion: str
    kind: Literal["inclusion", "exclusion"]
    # "met" = the criterion's statement is true of the patient, so a met exclusion blocks.
    # "not_applicable" = the criterion cannot apply to this patient at all; it is not a kind of unknown.
    status: Literal["met", "not_met", "unknown", "not_applicable"] = "unknown"
    patient_evidence: str | None = None
    trial_evidence: str
    sources: list[str]
    judged_by: Literal["rule", "jev", "llm", "none"] = "none"
    confidence: float | None = None
    decision_note: str | None = None


class MatchResult(BaseModel):
    trial_id: str
    title: str
    overall_assessment: Literal["likely_excluded_review_required", "potential_match_review_required", "criteria_met_review_required"]
    criteria: list[CriterionFinding]
    missing_information: list[str]
    source_url: str
    last_verified: str
    # Share of applicable criteria satisfied, cut hard when anything blocks. Not a probability of eligibility.
    score: int = 0
    breakdown: dict[str, int] = {}
