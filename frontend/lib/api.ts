// Client for backend/api.py. Types mirror backend/schema.py and the route payloads.
import { supabase } from "./supabase";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export const STATUSES = ["RECRUITING", "NOT_YET_RECRUITING", "ENROLLING_BY_INVITATION", "ACTIVE_NOT_RECRUITING", "SUSPENDED", "TERMINATED", "COMPLETED", "WITHDRAWN",
  "UNKNOWN", "AVAILABLE", "NO_LONGER_AVAILABLE", "TEMPORARILY_NOT_AVAILABLE", "APPROVED_FOR_MARKETING", "WITHHELD"] as const;
export const PHASES = ["EARLY_PHASE1", "PHASE1", "PHASE2", "PHASE3", "PHASE4", "NA"] as const;
export type Sex = "ALL" | "FEMALE" | "MALE";
export type Mode = "hybrid" | "dense" | "bm25";

export type Freshness = { index_version: string; registry_data_timestamp: string | null; ingested_at: string | null; snapshot_age_days: number | null; build_status: string };
export type Provider = "gemini" | "groq" | "huggingface" | "openrouter";
export type Stats = Freshness & { trials: number; raw_count: number | null; unique_count: number | null; accepted_count: number | null; rejected_count: number | null;
  chunk_count: number | null; embedding_model: string; judge_model: string;
  /** Model per chat provider; null when the deployment has no key for it. */
  chat_models: Record<Provider, string | null>;
  /** Selective judging (Jev, then Groq) is switched on for this deployment. */
  paid_judges: boolean;
  /** The synthetic patient every account may match. */
  demo_patient: string };

export type Plan = { intent: "search" | "detail" | "compare" | "patient_match" | "literature"; conditions: string[]; status: string[]; phase: string[]; sex: Sex | null;
  age: number | null; location: string | null; biomarkers: string[]; stage: string[]; trial_ids: string[]; freshness_required: boolean; live_lookup_allowed: boolean;
  unknowns: string[]; needs_clarification: boolean };
export type Chunk = { id: string; text: string; dense_distance: number | null; bm25_score: number | null };
export type Hit = { nct_id: string; fused_rank: number; rrf_score: number; rerank_score: number | null; chunks: Chunk[]; title: string; overall_status: string;
  phases: string[]; source_url: string; last_update_post_date: string | null };
export type SearchRequest = { query: string; status?: string[]; phase?: string[]; sex?: Sex | null; age?: number | null; location?: string | null; mode?: Mode; final_k?: number };
export type SearchResponse = Freshness & { plan: Plan; trials_passing_hard_filters: number | null; results: Hit[]; notice: string };

export type FindingStatus = "met" | "not_met" | "unknown" | "not_applicable";
export type Finding = { criterion: string; kind: "inclusion" | "exclusion"; status: FindingStatus; patient_evidence: string | null; trial_evidence: string; sources: string[];
  judged_by: "rule" | "jev" | "llm" | "none"; confidence: number | null; decision_note: string | null };
export type MatchResult = { trial_id: string; title: string;
  overall_assessment: "likely_excluded_review_required" | "potential_match_review_required" | "criteria_met_review_required";
  criteria: Finding[]; missing_information: string[]; source_url: string; last_verified: string; score: number;
  breakdown: { satisfied: number; blocking: number; unknown: number; not_applicable: number } };
/** The user's own facts for matching themselves; mirrors backend/api.py SelfProfile (no name, birth year, email or place). */
export type SelfProfile = { age: number; sex: "FEMALE" | "MALE"; diagnosis: string; stage: string | null; stage_details: string | null; disease_status: string | null; biomarkers: string[]; ecog: number | null;
  medications: string[]; procedures: string[] };
/** Exactly one of patient_id (synthetic) or profile (the user). The server's judge threshold applies. */
export type MatchRequest = { patient_id?: string; profile?: SelfProfile; k: number; judge: "none" | "selective" };
/** patient_id is "self" for the user's own profile; synthetic_birth_date is a made-up date shown for synthetic patients only. */
export type MatchResponse = Freshness & { patient_id: string; synthetic_birth_date: string | null; facts: string[]; matches: MatchResult[]; notice: string };

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type Source = { nct_id: string; title: string; overall_status: string; phases: string[]; source_url: string; last_update_post_date: string | null; quotes: string[] };
/** A PubMed record the answer may cite as [PMID:…]: published research, not registry fact. */
export type Article = { pmid: string; title: string; journal: string; year: string | null; url: string; quotes: string[] };
/** An ICD-10-CM entry from NLM Clinical Tables, cited as [ICD:…]. */
export type Code = { code: string; name: string };
/** A brand named as prior therapy and the RxNorm generic names added to the trial search. */
export type Drug = { name: string; generics: string[] };
/** model is "provider:model", null when nothing matched and no model was asked. */
export type ChatResponse = Freshness & { answer: string; sources: Source[]; articles: Article[]; codes: Code[]; drugs: Drug[]; limitations: string[]; model: string | null; notice: string };

/** A non-2xx reply, or status 0 when the API could not be reached at all. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(path: string, body?: unknown, authed = false): Promise<T> {
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";
  if (authed) {
    // getSession refreshes an expired token before handing it back.
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new ApiError(401, "Not signed in");
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  let response: Response;
  try {
    response = await fetch(API_URL + path, { method: body ? "POST" : "GET", headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, `The API at ${API_URL || "(NEXT_PUBLIC_API_URL is not set)"} could not be reached.`);
  }
  if (!response.ok) {
    const detail = (await response.json().catch(() => null))?.detail;
    // FastAPI sends a string for raised errors and a list of field errors for validation failures.
    const message = typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((d) => `${d.loc?.slice(1).join(".")}: ${d.msg}`).join("; ") : response.statusText;
    throw new ApiError(response.status, message);
  }
  return response.json();
}

export const api = {
  stats: () => call<Stats>("/api/stats"),
  search: (request: SearchRequest) => call<SearchResponse>("/api/search", request, true),
  match: (request: MatchRequest) => call<MatchResponse>("/api/match", request, true),
  chat: (messages: ChatTurn[], provider: Provider, literature: boolean) => call<ChatResponse>("/api/chat", { messages, provider, literature }, true),
};
