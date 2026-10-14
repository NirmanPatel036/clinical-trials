"use client";

// Patient match: the form (MatchPanel, /workbench/match) and its results (MatchResults, /workbench/match/results).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api, ApiError, type Finding, type FindingStatus, type MatchResponse, type MatchResult } from "@/lib/api";
import { type Profile, selfProfile } from "@/lib/profile";
import { s } from "@/lib/s";

import { CARD, EmptyState, FIELD, Field, FINDING, ICON, Icon, LABEL, MONO, Notice, Pill, Segmented, SLIM } from "./ui";

const ASSESSMENT: Record<MatchResult["overall_assessment"], { label: string; fg: string; bg: string }> = {
  likely_excluded_review_required: { label: "Likely excluded — review required", fg: "#C8442F", bg: "#F8E2DC" },
  potential_match_review_required: { label: "Potential match — review required", fg: "#7A500A", bg: "#F6EBD3" },
  criteria_met_review_required: { label: "Criteria met — review required", fg: "#1F8A5B", bg: "#E1F2E9" },
};
const FACT_FIELDS = ["age", "sex", "diagnosis", "stage", "stage_details", "disease_status", "biomarkers", "ecog", "medications", "procedures"];
// decision_note codes from backend/decide.py, in plain words.
const NOTE: Record<string, string> = {
  low_confidence: "Jev wasn’t confident enough (below 0.9)",
  evidence_uncertain: "Jev couldn’t tell which fact supports it",
  high_risk: "Safety-sensitive wording, so Jev was skipped",
  ambiguous: "Long or ambiguous wording, so Jev was skipped",
  unsuitable: "Too many facts for Jev to compare",
  contradictory: "Jev found the facts point both ways",
  evidence_missing: "No fact settles it",
  evidence_invalid: "The answer didn’t quote a fact exactly, so it was rejected",
  judges_disagree: "Jev and Groq disagreed",
};
const SKIPS_JEV = new Set(["high_risk", "ambiguous", "unsuitable"]);

/** Who settled a finding, or why nobody did, and the reasons behind it in plain words. */
function judgement(f: Finding): { by: string; why: string[] } {
  const codes = (f.decision_note ?? "").split("; ").filter(Boolean);
  const noGroq = codes.some((c) => c.startsWith("not escalated"));
  const why = codes.map((c) => c.startsWith("not escalated") ? "Groq isn’t set up on this server, so it wasn’t asked" : NOTE[c] ?? c);
  if (f.judged_by === "rule") return { by: "Decided by rule", why };
  if (f.judged_by === "jev") return { by: f.confidence != null ? `Jev · self-reported confidence ${f.confidence.toFixed(2)}` : "Jev", why };
  if (f.judged_by === "llm") return { by: "Groq", why: why.map((w) => `Asked Groq because: ${w.charAt(0).toLowerCase()}${w.slice(1)}`) };
  if (!codes.length) return { by: "Not judged · rules only", why };
  if (noGroq) return { by: "Not settled", why };
  return { by: SKIPS_JEV.has(codes[0]) ? "Groq couldn’t settle it" : "Jev and Groq couldn’t settle it", why };
}
type Show = "all" | FindingStatus | "blocking";

/** A short code for the synthetic patient ("SP-4K9Q2T"), stable for the same record, so the file id is never shown. */
const patientCode = (id: string) => "SP-" + [...id].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7).toString(36).toUpperCase().padStart(6, "0").slice(-6);

const blocks = (f: Finding) => (f.kind === "inclusion" && f.status === "not_met") || (f.kind === "exclusion" && f.status === "met");

/** Status wording that says what the finding does to the trial: a met exclusion blocks, an unmet one is satisfied. */
function statusText(f: Finding) {
  if (blocks(f)) return `${FINDING[f.status].label} · blocking`;
  return f.kind === "exclusion" && f.status === "not_met" ? "Not met · satisfied" : FINDING[f.status].label;
}

function FactsCard({ match }: { match: MatchResponse }) {
  const has = (field: string) => match.facts.some((line) => line.startsWith(`${field}:`));
  const missing = [...FACT_FIELDS.filter((field) => !has(field)), ...(has("lab") ? [] : ["labs"])];
  return (
    <article style={s("background:#142237;color:#F7F6F2;border-radius:20px;padding:24px;box-shadow:0 30px 60px -36px rgba(20,34,55,.6);display:flex;flex-direction:column;gap:14px;position:relative;overflow:hidden;min-width:0")}>
      <div style={s(`font-size:13px;color:#9AA3B5;overflow-wrap:anywhere`)}>
        {match.patient_id === "self" ? "You, from your profile" : <><span style={s(MONO)}>{patientCode(match.patient_id)}</span> · synthetic patient</>} · facts used
      </div>
      {match.synthetic_birth_date && <div style={s("font-size:12px;color:#9AA3B5;margin-top:-10px")}>Born {match.synthetic_birth_date} (made up, shown only here)</div>}
      <div style={s(`${MONO};font-size:12.5px;line-height:1.9;overflow-wrap:anywhere`)}>
        {match.facts.map((line) => <div key={line}>{line}</div>)}
        {missing.map((field) => <div key={field} style={s("color:#E3C27F")}>{field}: not recorded</div>)}
      </div>
      <div style={s("font-size:12px;color:#9AA3B5;line-height:1.45")}>Missing facts are why criteria come back Unknown.</div>
    </article>
  );
}

function ScoreCard({ result }: { result: MatchResult }) {
  const b = result.breakdown, applicable = b.satisfied + b.blocking + b.unknown, label = ASSESSMENT[result.overall_assessment];
  const counts: [number, string][] = [[b.satisfied, "satisfied"], [b.blocking, "blocking"], [b.unknown, "unknown"], [b.not_applicable, "n/a"]];
  return (
    <article style={s(CARD + ";gap:16px")}>
      <div style={s("display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap")}>
        <span style={s("font-size:13px;color:#4B5568")}>Trial score</span>
        <span style={s(`font-size:12px;padding:4px 10px;border-radius:999px;background:${label.bg};color:${label.fg}`)}>{label.label}</span>
      </div>
      <div style={s("display:flex;align-items:baseline;gap:6px")}>
        <span style={s(`${SLIM};font-weight:200;font-size:96px;line-height:.9;letter-spacing:-.04em`)}>{result.score}</span><span style={s("font-size:28px;color:#7A8293")}>%</span>
      </div>
      <div style={s("display:flex;gap:3px;height:10px")} aria-hidden>
        {([[b.satisfied, "#1F8A5B"], [b.blocking, "#C8442F"], [b.unknown, "#E3C27F"], [b.not_applicable, "#D5D7DC"]] as const).map(([n, color]) => n > 0 && <span key={color} style={s(`flex:${n};border-radius:3px;background:${color}`)} />)}
      </div>
      <div style={s("display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;font-size:12px;color:#4B5568")}>
        {counts.map(([n, name]) => <div key={name}><div style={s("font-size:20px;color:#142237")}>{n}</div>{name}</div>)}
      </div>
      <p style={s("margin:0;font-size:12px;line-height:1.5;color:#7A8293;border-top:1px solid #EEECE5;padding-top:12px")}>
        {b.satisfied} satisfied, {b.blocking} blocking, {b.unknown} unknown of {applicable} applicable criteria; {b.not_applicable} not applicable. Unknown never counts as satisfied, and any blocking criterion
        cuts the score to a fifth. A share of criteria, not a probability of eligibility.{applicable < 5 && " With this few criteria the number means little."}
      </p>
    </article>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  const tone = FINDING[finding.status], exclusion = finding.kind === "exclusion";
  const { by, why } = judgement(finding);
  const evidence = finding.trial_evidence.length > 160 ? `${finding.trial_evidence.slice(0, 160)}…` : finding.trial_evidence;
  return (
    <div className="finding" style={s("padding:18px 24px;border-bottom:1px solid #EEECE5;align-items:start")}>
      <span style={s(`justify-self:start;${MONO};font-size:10px;letter-spacing:.06em;padding:4px 8px;border-radius:5px;border:1px solid #142237;background:${exclusion ? "#142237" : "#FFFFFF"};color:${exclusion ? "#F7F6F2" : "#142237"}`)}>
        {finding.kind.toUpperCase()}
      </span>
      <div style={s("font-size:14px;line-height:1.45;overflow-wrap:anywhere")}>{finding.criterion}</div>
      <div>
        <div style={s(LABEL + ";margin-bottom:4px")}>Trial evidence</div>
        <div title={finding.trial_evidence} style={s(`${MONO};font-size:12px;color:#4B5568;line-height:1.5;overflow-wrap:anywhere`)}>{evidence}</div>
      </div>
      <div>
        <div style={s(LABEL + ";margin-bottom:4px")}>Patient fact</div>
        <div style={s(`${MONO};font-size:12px;line-height:1.5;overflow-wrap:anywhere;color:${finding.patient_evidence ? "#142237" : "#A86F0C"}`)}>{finding.patient_evidence ?? (finding.status === "unknown" ? "None of the facts settles this" : "No fact quoted")}</div>
      </div>
      <div style={s("display:flex;flex-direction:column;gap:6px;align-items:flex-start")}>
        <Pill fg={tone.fg} bg={tone.bg}>{statusText(finding)}</Pill>
        <span style={s(LABEL)}>{by}</span>
        {why.map((line) => <span key={line} style={s("font-size:11px;line-height:1.4;color:#7A500A")}>{line}</span>)}
      </div>
    </div>
  );
}

function TrialReview({ result, show, open }: { result: MatchResult; show: Show; open: boolean }) {
  const label = ASSESSMENT[result.overall_assessment];
  const shown = result.criteria.filter((f) => show === "all" || (show === "blocking" ? blocks(f) : f.status === show));
  return (
    <details open={open} style={s("border-radius:24px;background:rgba(255,255,255,.55);border:1px solid rgba(20,34,55,.08);padding:16px")}>
      {/* The summary stays a list item so the browser keeps its open/close marker. */}
      <summary style={s("padding:4px 6px")}>
        <span style={s("display:inline-flex;align-items:center;gap:12px;flex-wrap:wrap;vertical-align:middle;max-width:calc(100% - 24px)")}>
          <span style={s(`${SLIM};font-weight:300;font-size:28px;line-height:1`)}>{result.score}%</span>
          <span style={s(`font-size:12px;padding:4px 10px;border-radius:999px;background:${label.bg};color:${label.fg}`)}>{label.label}</span>
          <span style={s(`${MONO};font-size:12px;color:#4B5568`)}>{result.trial_id}</span>
          <span style={s("font-size:15px")}>{result.title}</span>
        </span>
      </summary>
      <div style={s("display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:20px;margin-top:16px")}>
        <ScoreCard result={result} />
        <article style={s(CARD)}>
          <div style={s("font-size:13px;color:#4B5568")}>Information needed to assess</div>
          {result.missing_information.length ? (
            <ul style={s("margin:0;padding-left:18px;font-size:14px;line-height:1.5;max-height:220px;overflow:auto")}>{result.missing_information.map((item, i) => <li key={i}>{item}</li>)}</ul>
          ) : (
            <div style={s("font-size:14px;color:#4B5568")}>Every criterion has a finding. Review is still required.</div>
          )}
          <div style={s("font-size:12px;color:#7A8293;border-top:1px solid #EEECE5;padding-top:10px;display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between")}>
            <a href={result.source_url} target="_blank" rel="noreferrer" style={s("display:flex;gap:5px;align-items:center")}>ClinicalTrials.gov<Icon d={ICON.source} size={13} /></a>
            <span style={s(MONO)}>registry data as of {result.last_verified}</span>
          </div>
        </article>
      </div>
      <article style={s("background:#FFFFFF;border-radius:20px;box-shadow:0 1px 0 rgba(20,34,55,.04),0 30px 60px -36px rgba(20,34,55,.4);overflow:hidden;margin-top:20px")}>
        <div style={s("display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid #EEECE5;flex-wrap:wrap")}>
          <span style={s("font-size:17px")}>Criterion review</span>
          <span style={s(`${MONO};font-size:12px;color:#7A8293`)}>{result.trial_id} · {shown.length} of {result.criteria.length}</span>
          <span style={s("margin-left:auto;font-size:12px;color:#7A8293")}>For an exclusion, “Met” means the exclusion applies.</span>
        </div>
        {shown.map((finding, i) => <FindingRow key={i} finding={finding} />)}
        {!shown.length && <div style={s("padding:18px 24px;font-size:14px;color:#4B5568")}>No criteria with this status.</div>}
        <div style={s("padding:14px 24px;font-size:12px;color:#7A8293;background:#FBFAF7")}>Not an eligibility decision. A clinician must review every criterion against the current registry record.</div>
      </article>
    </details>
  );
}

function download(match: MatchResponse) {
  // Same shape as the workbench export: every finding plus an empty slot for the reviewer.
  const rows = match.matches.map((m) => ({ ...m, criteria: m.criteria.map((f) => ({ ...f, clinician_label: null })) }));
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }));
  link.download = `adjudication-${match.patient_id}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** The user matches themselves from their profile, or the one synthetic patient every account has. */
export function MatchPanel({ profile, demoPatient, paidJudges, onAuthLost, onMatched }:
  { profile: Profile; demoPatient: string | null; paidJudges: boolean | null; onAuthLost: () => void; onMatched: (match: MatchResponse | null) => void }) {
  const router = useRouter();
  const self = selfProfile(profile);
  const [who, setWho] = useState<"self" | "synthetic">(self ? "self" : "synthetic");
  const [k, setK] = useState(5);
  const [judge, setJudge] = useState<"none" | "selective">("none");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  // The synthetic patient's id arrives with /api/stats, after the first render.
  const chosen = demoPatient ?? "";

  async function run(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    // A denied or failed request must not leave an earlier patient's findings behind.
    onMatched(null);
    try {
      onMatched(await api.match({ ...(who === "self" && self ? { profile: self } : { patient_id: chosen }), k, judge: paidJudges ? judge : "none" }));
      router.push("/workbench/match/results");
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : new ApiError(0, String(caught));
      if (apiError.status === 401) return onAuthLost();
      setError(apiError);
    } finally {
      setBusy(false);
    }
  }

  const denied = error?.status === 403 && error.message.includes("not authorised");
  const judging = paidJudges === true && judge === "selective";
  const blocked = busy || (judging && !consent) || (who === "synthetic" && !chosen) || (who === "self" && !self);
  const handling = [
    `Sent to TypeSafe (Jev): ${who === "self" ? "your" : "this synthetic patient’s"} fact lines shown after the run (age, sex, diagnosis, stage, stage details, biomarkers, ECOG, medications, procedures) and each criterion the rules left open.`,
    "Sent to Groq: the same fact lines, only for criteria Jev should not decide alone.",
    `Never sent: ${who === "self" ? "your name, email, birth year or city" : "the patient’s name, birth date or address"}.`,
    "A judge’s answer counts only if it quotes one of those fact lines word for word; otherwise the criterion stays Unknown.",
    "Logs record that the run happened and its outcome, never the facts. Each run costs money.",
  ];
  return (
    <div style={s("display:flex;flex-direction:column;gap:20px")}>
      <form onSubmit={run} style={s(CARD + ";gap:18px")}>
        <div style={s("font-size:13px;color:#4B5568")}>
          Match yourself from your profile, or a synthetic patient if you are not a patient. Findings are per criterion; for an exclusion, “Met” means the exclusion applies.
          Unknown is never counted as a match. Every run is logged, without the patient’s facts.
        </div>
        <div style={s("display:flex;align-items:center;gap:10px;font-size:13px;color:#4B5568;flex-wrap:wrap")}>Patient
          <Segmented label="Patient" options={[["self", "Me (my profile)"], ["synthetic", "Synthetic patient"]] as const} value={who} onChange={setWho} />
        </div>
        {who === "self" && !self && <Notice tone="red">Your profile needs a birth year, sex and diagnosis to match. Add them on My profile.</Notice>}
        <div style={s("display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:18px;align-items:start")}>
          {who === "synthetic" && (
            <Field label="Synthetic patient" hint="A made-up record for trying the matcher. Not a real person.">
              <div style={s(`${FIELD};${MONO};font-size:13px;background:#F7F6F2;color:#142237`)}>{chosen ? patientCode(chosen) : "Loading…"}</div>
            </Field>
          )}
          <Field label="Trials to assess" hint="1–10. Recruiting trials that accept the patient’s age and sex, ordered by score.">
            <input className="field" type="number" min={1} max={10} required value={k} onChange={(e) => setK(Number(e.target.value))} style={s(FIELD)} />
          </Field>
        </div>
        <div style={s("display:flex;align-items:center;gap:10px;font-size:13px;color:#4B5568;flex-wrap:wrap")}>Undecided criteria
          {paidJudges === false
            ? <span>Rules only. The selective judge (Jev, then Groq) is switched off on this server; an administrator turns it on with <span style={s(MONO)}>NEXTRIAL_ALLOW_PAID_JUDGES=1</span>.</span>
            : <Segmented label="Judge" options={[["none", "Rules only"], ["selective", "Selective judge · Jev, then Groq"]] as const} value={judge} onChange={setJudge} />}
        </div>
        {judging && (
          <div style={s("display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:16px;border:1px dashed #A86F0C;background:#FBF6EA")}>
            <div style={s("font-size:13px;color:#7A500A")}>How {who === "self" ? "your" : "this patient’s"} data is handled</div>
            <ul style={s("margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px;font-size:13px;color:#4B5568;line-height:1.45")}>
              {handling.map((line) => (
                <li key={line} style={s("display:flex;gap:8px;align-items:flex-start")}><span style={s("color:#1F8A5B;display:flex;margin-top:1px")}><Icon d="M5 12.5l4.5 4.5L19 7.5" size={15} /></span>{line}</li>
              ))}
            </ul>
            <label style={s("display:flex;gap:10px;align-items:flex-start;font-size:13px;color:#142237")}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={s("margin-top:3px;accent-color:#142237")} />
              {who === "self" ? "I agree to send my fact lines to TypeSafe and Groq as described." : "I understand these fact lines go to TypeSafe and Groq as described."}
            </label>
          </div>
        )}
        <button className="btn-ink" disabled={blocked}
          style={s(`align-self:flex-start;font-size:15px;border:0;border-radius:999px;padding:12px 22px;background:#142237;color:#F7F6F2;opacity:${blocked ? 0.5 : 1}`)}>
          {busy ? (judging ? "Matching and judging… this can take a minute" : "Matching…") : who === "self" ? "Match me to trials" : "Match patient to trials"}
        </button>
      </form>

      {denied && (
        <EmptyState dark art={<Icon d={ICON.denied} size={48} color="#F7F6F2" width={1.3} />} title="Access denied and logged">
          Your account is not authorised for <span style={s(`${MONO};font-size:12.5px;color:#F7F6F2`)}>{patientCode(chosen)}</span>. No patient facts are shown.
        </EmptyState>
      )}
      {error && !denied && <Notice tone="red">{error.message}{error.status === 502 && " Run again with rules only to see rule findings."}</Notice>}

    </div>
  );
}

/** The last run's facts, scores and criterion review, with a way back to the form. */
export function MatchResults({ match }: { match: MatchResponse | null }) {
  const [show, setShow] = useState<Show>("all");
  const back = (
    <Link href="/workbench/match" className="chip" style={s("align-self:flex-start;font-size:13px;padding:7px 12px;border-radius:999px;border:1px solid #D6D2C6;background:#FFFFFF;display:flex;align-items:center;gap:6px")}>
      <span style={s("display:flex;transform:rotate(180deg)")}><Icon d={ICON.chevron} size={13} /></span>Back to Patient match
    </Link>
  );
  if (!match) {
    return (
      <div style={s("display:flex;flex-direction:column;gap:20px")}>
        {back}
        <EmptyState art={<Icon d={ICON.match} size={48} width={1.3} />} title="No match results yet">Run a match on the Patient match page; the results open here.</EmptyState>
      </div>
    );
  }
  return (
    <div style={s("display:flex;flex-direction:column;gap:20px")}>
      {back}
      <div style={s("display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:20px;align-items:start")}>
        <FactsCard match={match} />
        <article style={s(CARD)}>
          <div style={s("font-size:13px;color:#4B5568")}>{match.matches.length} trial{match.matches.length === 1 ? "" : "s"} assessed</div>
          <div style={s("font-size:14px;color:#4B5568")}>Read the label first, then the score, then the counts behind it. Every trial needs clinician review, whatever its score.</div>
          <div style={s("display:flex;align-items:center;gap:10px;font-size:13px;color:#4B5568;flex-wrap:wrap")}>Show criteria
            <Segmented label="Show criteria" value={show} onChange={setShow}
              options={[["all", "All"], ["unknown", "Unknown"], ["blocking", "Blocking"], ["met", "Met"], ["not_met", "Not met"], ["not_applicable", "N/A"]] as const} />
          </div>
          <button type="button" className="btn-line" onClick={() => download(match)} disabled={!match.matches.length}
            style={s("align-self:flex-start;font-size:13px;border:1px solid #D6D2C6;border-radius:999px;padding:7px 14px;background:#FFFFFF;display:flex;gap:6px;align-items:center")}>
            <Icon d={ICON.export} size={14} />Export for adjudication (JSON)
          </button>
          <div style={s("font-size:12px;color:#7A8293")}>The file holds each finding with an empty clinician label. It includes patient fact lines and any model output, and cannot be imported back.</div>
        </article>
      </div>
      {!match.matches.length && <Notice>No recruiting trial in the snapshot accepts this patient’s age and sex and matches their diagnosis text.</Notice>}
      {match.matches.map((result, i) => <TrialReview key={result.trial_id} result={result} show={show} open={i === 0} />)}
      <Notice>{match.notice}</Notice>
    </div>
  );
}
