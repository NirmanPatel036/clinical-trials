"use client";

import { DIAGNOSES, DISEASE_STATUSES, STAGES, type Profile } from "@/lib/profile";
import { s } from "@/lib/s";

const INPUT = "border:1px solid #D6D2C6;border-radius:12px;padding:12px 14px;font-size:15px;color:#142237;background:#FFFFFF;width:100%";
const LABEL = "display:flex;flex-direction:column;gap:6px;font-size:13px;color:#4B5568;min-width:0";
const ROW = "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:14px;align-items:start";
const HINT = "font-size:12px;color:#7A8293";
const THIS_YEAR = new Date().getFullYear();

/** Personal and clinical details. Only name, birth year, sex and diagnosis are required; the rest may be left as not recorded. */
export function ProfileFields({ value, onChange }: { value: Profile; onChange: (value: Profile) => void }) {
  const bind = (key: keyof Profile) => ({ value: value[key], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [key]: e.target.value }) });
  const select = (key: keyof Profile, options: readonly string[], required = false) => (
    <select className="field" required={required} {...bind(key)} style={s(INPUT)}>
      <option value="">{required ? "Select…" : "Not sure / not recorded"}</option>
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  );
  return (
    <>
      <label style={s(LABEL)}>Full name<input className="field" required autoComplete="name" maxLength={120} {...bind("full_name")} style={s(INPUT)} /></label>
      <div style={s(ROW)}>
        <label style={s(LABEL)}>Year of birth<input className="field" type="number" required min={THIS_YEAR - 120} max={THIS_YEAR} step={1} autoComplete="bday-year" {...bind("birth_year")} style={s(INPUT)} /></label>
        <label style={s(LABEL)}>Sex
          <select className="field" required {...bind("sex")} style={s(INPUT)}><option value="">Select…</option><option value="FEMALE">Female</option><option value="MALE">Male</option></select>
          <span style={s(HINT)}>Trials are registered as female, male or all.</span>
        </label>
      </div>
      <div style={s(ROW)}>
        <label style={s(LABEL)}>Diagnosis{select("diagnosis", DIAGNOSES, true)}<span style={s(HINT)}>The index covers these eight cancer types only.</span></label>
        <label style={s(LABEL)}>Stage{select("stage", STAGES)}</label>
        <label style={s(LABEL)}>Disease status{select("disease_status", DISEASE_STATUSES)}</label>
      </div>
      <label style={s(LABEL)}>Stage details<input className="field" maxLength={200} placeholder="e.g. high-risk: T4N0M0, poorly differentiated, 10 lymph nodes examined" {...bind("stage_details")} style={s(INPUT)} />
        <span style={s(HINT)}>Optional. What your pathology report says beyond the stage: TNM, grade, high-risk features. Some trials ask for these, such as “high-risk Stage II”.</span></label>
      <label style={s(LABEL)}>Biomarkers<input className="field" maxLength={200} placeholder="e.g. HER2 positive, BRCA1 mutation" {...bind("biomarkers")} style={s(INPUT)} /><span style={s(HINT)}>Optional. Separate with commas.</span></label>
      <label style={s(LABEL)}>ECOG performance status{select("ecog", ["0", "1", "2", "3", "4"])}<span style={s(HINT)}>Only if your care team has told you the number.</span></label>
      <label style={s(LABEL)}>Current medications<input className="field" maxLength={300} {...bind("medications")} style={s(INPUT)} /><span style={s(HINT)}>Optional. Separate with commas.</span></label>
      <label style={s(LABEL)}>Past procedures<input className="field" maxLength={300} {...bind("procedures")} style={s(INPUT)} /><span style={s(HINT)}>Optional. Separate with commas.</span></label>
      <div style={s(ROW)}>
        <label style={s(LABEL)}>City<input className="field" maxLength={100} autoComplete="address-level2" {...bind("city")} style={s(INPUT)} /></label>
        <label style={s(LABEL)}>State / region<input className="field" maxLength={100} autoComplete="address-level1" {...bind("state")} style={s(INPUT)} /></label>
        <label style={s(LABEL)}>Country<input className="field" maxLength={100} autoComplete="country-name" placeholder="e.g. United States" {...bind("country")} style={s(INPUT)} /></label>
      </div>
      <p style={s("margin:0;font-size:12px;color:#7A8293")}>Location is optional and only used when you choose to filter trials by place. Anything left blank stays “not recorded” and is never guessed.</p>
    </>
  );
}
