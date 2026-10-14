// The details a person gives about themselves, kept in `public.profiles` (readable only after MFA).
import type { SearchRequest, SelfProfile, Sex } from "./api";
import { supabase } from "./supabase";

// The cancer types the trial index covers (backend/ingest.py CONDITIONS).
export const DIAGNOSES = ["Breast cancer", "Lung cancer", "Melanoma", "Colorectal cancer", "Prostate cancer", "Pancreatic cancer", "Leukemia", "Ovarian cancer"] as const;
export const STAGES = ["Stage I", "Stage II", "Stage III", "Stage IV"] as const;
export const DISEASE_STATUSES = ["active", "recurrence"] as const;

/** Everything is a string so it can sit straight in form inputs; an empty string means "not recorded". */
export type Profile = { full_name: string; birth_year: string; sex: "" | Exclude<Sex, "ALL">; diagnosis: string; stage: string; stage_details: string; disease_status: string; biomarkers: string;
  ecog: string; medications: string; procedures: string; city: string; state: string; country: string };

export const EMPTY: Profile = { full_name: "", birth_year: "", sex: "", diagnosis: "", stage: "", stage_details: "", disease_status: "", biomarkers: "", ecog: "", medications: "", procedures: "", city: "", state: "", country: "" };
const FIELDS = Object.keys(EMPTY) as (keyof Profile)[];

/** The signed-in user's row; null values come back as "". Needs an aal2 session. */
export async function loadProfile(): Promise<Profile> {
  // "*" rather than a field list, so a column added before its migration has run reads as "not recorded" instead of failing.
  const { data, error } = await supabase.from("profiles").select("*").single();
  if (error) throw error;
  const row = data as unknown as Record<keyof Profile, string | number | null>;
  return Object.fromEntries(FIELDS.map((key) => [key, row[key] == null ? "" : String(row[key])])) as Profile;
}

/** Blank fields are stored as null ("not recorded"). */
export async function saveProfile(userId: string, profile: Profile) {
  const row = Object.fromEntries(FIELDS.map((key) => [key, profile[key].trim() || null]));
  const { error } = await supabase.from("profiles").update(row).eq("id", userId);
  if (error) throw error;
}

/** True once this session has passed the authenticator step. */
export async function hasSecondFactor() {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data?.currentLevel === "aal2";
}

export const ageOf = (profile: Profile) => (profile.birth_year ? new Date().getFullYear() - Number(profile.birth_year) : null);

/** Age, sex and diagnosis are what trial filtering and ranking need at a minimum. */
export const isComplete = (profile: Profile) => Boolean(profile.birth_year && profile.sex && profile.diagnosis);

/** Fact lines in the backend's own format (match.fact_lines), plus what is not recorded. */
export function factLines(profile: Profile): { recorded: string[]; missing: string[] } {
  const facts: [string, string | number | null][] = [["age", ageOf(profile)], ["sex", profile.sex], ["diagnosis", profile.diagnosis], ["stage", profile.stage], ["stage_details", profile.stage_details], ["disease_status", profile.disease_status],
    ["biomarkers", profile.biomarkers], ["ecog", profile.ecog], ["medications", profile.medications], ["procedures", profile.procedures]];
  const has = ([, value]: [string, string | number | null]) => value !== "" && value != null;
  return { recorded: facts.filter(has).map(([name, value]) => `${name}: ${value}`), missing: facts.filter((fact) => !has(fact)).map(([name]) => name) };
}

const list = (text: string) => text.split(",").map((item) => item.trim()).filter(Boolean);

/** The profile as match facts, or null when age, sex or diagnosis is missing. Name, birth year and place stay behind. */
export function selfProfile(profile: Profile): SelfProfile | null {
  const age = ageOf(profile);
  if (age == null || !profile.sex || !profile.diagnosis) return null;
  return { age, sex: profile.sex, diagnosis: profile.diagnosis, stage: profile.stage || null, stage_details: profile.stage_details.trim() || null, disease_status: profile.disease_status || null, biomarkers: list(profile.biomarkers),
    ecog: profile.ecog ? Number(profile.ecog) : null, medications: list(profile.medications), procedures: list(profile.procedures) };
}

/** Every search fetches the API's maximum; the workbench pages through them five at a time. */
export const RESULTS_PER_SEARCH = 30;

/** The same candidate search the backend's patient matcher runs: recruiting trials accepting this age and sex, ranked on the disease text. */
export function profileSearch(profile: Profile): SearchRequest {
  return { query: [profile.diagnosis, profile.stage, profile.disease_status, profile.biomarkers].filter(Boolean).join(" "), status: ["RECRUITING"], sex: profile.sex || null, age: ageOf(profile), final_k: RESULTS_PER_SEARCH };
}

/** The whole profile (email aside) as an editable sentence for the search box, worded so the query parser reads age, sex and place.
 * Any "active" reads to the parser as trial status, so that status is written "ongoing disease". */
export function profileText(profile: Profile) {
  const age = ageOf(profile);
  const place = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");
  return [
    profile.full_name,
    [age != null && `${age} year old`, profile.sex.toLowerCase()].filter(Boolean).join(" "),
    profile.diagnosis,
    profile.stage,
    profile.stage_details && `stage details: ${profile.stage_details}`,
    profile.disease_status && (profile.disease_status === "active" ? "ongoing disease" : profile.disease_status),
    profile.biomarkers && `biomarkers: ${profile.biomarkers}`,
    profile.ecog && `ECOG ${profile.ecog}`,
    profile.medications && `medications: ${profile.medications}`,
    profile.procedures && `past procedures: ${profile.procedures}`,
    place && `in ${place}`,
  ].filter(Boolean).join(", ").slice(0, 500);
}
