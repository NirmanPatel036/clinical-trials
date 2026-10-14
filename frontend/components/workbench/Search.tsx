"use client";

// Find trials: the query box, the thinking state, the results and the query plan.
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PHASES, type Chunk, type Hit, type Plan, type SearchRequest, type SearchResponse, type Sex, type Stats } from "@/lib/api";
import { RESULTS_PER_SEARCH } from "@/lib/profile";
import type { SavedTrial } from "@/lib/saved";
import { s } from "@/lib/s";

import { useWorkbench } from "./context";
import { CARD, EmptyState, FIELD, Field, FlipText, human, ICON, Icon, LABEL, MONO, Notice, PHASE_LABEL, Pill, Segmented } from "./ui";

export const FIXED_QUERIES = [
  "HER2-positive breast cancer",
  "EGFR mutant non-small cell lung cancer osimertinib",
  "BRAF V600E melanoma immunotherapy",
  "KRAS G12C colorectal cancer",
  "PARP inhibitor BRCA ovarian cancer",
  "CAR-T relapsed leukemia",
];
const HARD = "font-size:12px;padding:4px 8px;border-radius:7px;background:#E3E9FF;color:#0036C8";
const SOFT = "font-size:12px;padding:4px 8px;border-radius:7px;background:#FBE3D0;color:#7A4A2A";
const CHIP = "font-size:13px;padding:7px 12px;border-radius:999px;border:1px solid #D6D2C6;background:#FFFFFF;color:#142237";
const toggled = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

/** `initial` seeds the fields; give the box a new key to load a different search into it. */
export function QueryBox({ busy, initial, profileText, onSearch }: { busy: boolean; initial?: SearchRequest; profileText: string; onSearch: (request: SearchRequest) => void }) {
  const [query, setQuery] = useState(initial?.query ?? "");
  const [phase, setPhase] = useState<string[]>(initial?.phase ?? []);
  const [sex, setSex] = useState<"" | Sex>(initial?.sex ?? "");
  const [age, setAge] = useState(initial?.age != null ? String(initial.age) : "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const active = phase.length + (sex ? 1 : 0) + (age ? 1 : 0) + (location.trim() ? 1 : 0);

  const run = (text: string) => {
    if (!text.trim() || busy) return;
    // The snapshot holds recruiting trials only, so status is not offered; retrieval stays on hybrid.
    onSearch({ query: text.trim(), status: initial?.status ?? [], phase, sex: sex || null, age: age === "" ? null : Number(age), location: location.trim() || null, mode: "hybrid", final_k: RESULTS_PER_SEARCH });
  };

  return (
    <form onSubmit={(event) => { event.preventDefault(); run(query); }} style={s(CARD + ";gap:16px;padding:20px")}>
      <div style={s("border-radius:18px;background:#F7F6F2;border:1px solid #E3E0D7;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 20px 40px -30px rgba(0,69,253,.5)")}>
        <span style={s("margin-top:3px")}><Icon d={ICON.search} size={20} color="#0045FD" width={1.6} /></span>
        <textarea aria-label="Describe the trials you are looking for" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={500} rows={2}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(query); } }}
          placeholder="Describe what you're looking for, e.g. recruiting trials for HER2-positive breast cancer in Texas"
          style={s("flex:1;min-width:0;font-size:16px;line-height:1.5;border:0;background:transparent;outline:none;resize:none;padding:0;font-family:inherit")} />
      </div>

      <div style={s("display:flex;flex-wrap:wrap;gap:8px;align-items:center")}>
        <button type="button" className="chip" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}
          style={s(`${CHIP};display:flex;align-items:center;gap:6px;${active ? "border-color:#0045FD;color:#0045FD" : ""}`)}>
          <Icon d={ICON.filter} size={14} />Filters{active ? ` · ${active}` : ""}
        </button>
        <button type="button" className="chip" disabled={!profileText || busy} onClick={() => setQuery(profileText)} title="Fill the box with your profile; edit it before searching"
          style={s(`${CHIP};display:flex;align-items:center;gap:6px;opacity:${profileText ? 1 : 0.5}`)}>
          <Icon d={ICON.user} size={14} />Use my profile
        </button>
        <button className="btn-blue" disabled={busy || !query.trim()}
          style={s(`margin-left:auto;font-size:15px;border:0;border-radius:999px;padding:11px 20px;background:#0045FD;color:#FFFFFF;display:flex;align-items:center;gap:8px;opacity:${busy || !query.trim() ? 0.5 : 1}`)}>
          {busy ? "Searching…" : "Search trials"}<Icon d={ICON.arrow} size={16} />
        </button>
      </div>

      {filtersOpen && (
        <div className="wb-in" style={s("border-radius:16px;background:#F7F6F2;padding:16px;display:flex;flex-direction:column;gap:16px")}>
          <div style={s("font-size:13px;color:#4B5568")}>Filters are strict: a trial that doesn't fit one is left out. Anything you say in your description is applied too.</div>
          <div style={s("display:flex;flex-direction:column;gap:8px")}>
            <span style={s("font-size:13px;color:#4B5568")}>Trial phase</span>
            <div role="group" aria-label="Trial phase" style={s("display:flex;flex-wrap:wrap;gap:6px")}>
              {PHASES.map((option) => {
                const on = phase.includes(option);
                return (
                  <button key={option} type="button" aria-pressed={on} onClick={() => setPhase(toggled(phase, option))}
                    style={s(`font-size:13px;padding:6px 12px;border-radius:999px;border:1px solid ${on ? "#0045FD" : "#D6D2C6"};background:${on ? "#E3E9FF" : "#FFFFFF"};color:${on ? "#0036C8" : "#4B5568"}`)}>
                    {PHASE_LABEL[option]}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={s("display:flex;align-items:center;gap:10px;font-size:13px;color:#4B5568;flex-wrap:wrap")}>Sex
            <Segmented label="Sex" options={[["", "Any"], ["FEMALE", "Female"], ["MALE", "Male"]] as const} value={sex} onChange={setSex} />
          </div>
          <div style={s("display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:14px;align-items:start")}>
            <Field label="Age" hint="In years">
              <input className="field" type="number" min={0} max={120} step={1} value={age} onChange={(e) => setAge(e.target.value)} style={s(FIELD)} />
            </Field>
            <Field label="Location" hint="City, state or country, e.g. United States">
              <input className="field" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} style={s(FIELD)} />
            </Field>
          </div>
          {active > 0 && (
            <button type="button" onClick={() => { setPhase([]); setSex(""); setAge(""); setLocation(""); }}
              style={s("align-self:flex-start;border:0;background:none;padding:0;color:#0045FD;font-size:13px")}>Clear filters</button>
          )}
        </div>
      )}

      <div style={s("display:flex;flex-wrap:wrap;gap:6px;align-items:center")}>
        <span style={s("font-size:13px;color:#7A8293;margin-right:2px")}>Try:</span>
        {FIXED_QUERIES.map((example) => (
          <button key={example} type="button" className="chip" disabled={busy} onClick={() => { setQuery(example); run(example); }}
            style={s("font-size:12.5px;padding:5px 11px;border-radius:999px;border:1px solid #E3E0D7;background:transparent;color:#4B5568")}>
            {example}
          </button>
        ))}
      </div>
    </form>
  );
}

const STEPS = ["Reading your question", "Applying your filters", "Searching the trial registry", "Ranking the closest matches", "Pulling the passages that matched"];

/** Shown while a search runs: what is happening, plus placeholder cards where results will land. */
export function Thinking({ query, trials }: { query: string; trials?: number }) {
  return (
    <div role="status" aria-live="polite" style={s("display:flex;flex-direction:column;gap:16px")}>
      <div className="wb-in" style={s(CARD + ";flex-direction:row;align-items:center;gap:16px")}>
        <div style={s("position:relative;width:44px;height:44px;flex:none")}>
          <div className="wb-orbit" style={s("position:absolute;inset:0;border-radius:50%;border:2px solid #E3E9FF;border-top-color:#0045FD")} />
          <div style={s("position:absolute;inset:12px;border-radius:50%;background:radial-gradient(circle,#6E8DFF,#0045FD)")} />
        </div>
        <div style={s("min-width:0;flex:1")}>
          <div style={s("font-size:16px;display:flex")}><FlipText lines={trials ? STEPS.map((step) => step === "Searching the trial registry" ? `Searching ${trials.toLocaleString("en-US")} trials` : step) : STEPS} /></div>
          <div style={s("font-size:13px;color:#7A8293;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>“{query}”</div>
        </div>
      </div>
      {[0, 1].map((n) => (
        <div key={n} style={s(CARD + ";gap:12px")} aria-hidden>
          <div style={s("display:flex;gap:8px")}><div className="wb-skeleton" style={s("height:22px;width:92px;border-radius:999px")} /><div className="wb-skeleton" style={s("height:22px;width:70px;border-radius:999px")} /></div>
          <div className="wb-skeleton" style={s("height:20px;width:85%")} />
          <div className="wb-skeleton" style={s("height:20px;width:60%")} />
          <div className="wb-skeleton" style={s("height:56px;width:100%;margin-top:6px")} />
        </div>
      ))}
    </div>
  );
}

const STOP = new Set(["with", "trial", "trials", "that", "this", "from", "near", "phase", "recruiting", "study", "studies", "patients", "women", "men", "years", "old", "for", "and", "the"]);
const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Words worth highlighting in passages: what the person typed, plus conditions and biomarkers the plan recognised. */
function termsOf(query: string, plan: Plan) {
  const words = [...query.split(/[^\p{L}\p{N}-]+/u), ...plan.conditions, ...plan.biomarkers].map((w) => w.trim().toLowerCase());
  return [...new Set(words.filter((w) => w.length >= 3 && !STOP.has(w)))];
}

function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${terms.map(escapeRe).join("|")})`, "gi"));
  return <>{parts.map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}</>;
}

// Section names from backend/index.py chunking.
const SECTION: Record<string, string> = { overview: "About this trial", inclusion_criteria: "Who can join", exclusion_criteria: "Who cannot join", eligibility: "Who can join", locations: "Where it runs" };
const sectionOf = (chunk: Chunk) => { const name = chunk.id.split(":")[1] ?? ""; return SECTION[name] ?? human(name || "passage"); };
const passageOf = (chunk: Chunk) => chunk.text.split("\n").slice(1).join("\n").trim() || chunk.text;
const dateOf = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not recorded");

function Passage({ chunk, terms, clamp }: { chunk: Chunk; terms: string[]; clamp: boolean }) {
  return (
    <div style={s("display:flex;flex-direction:column;gap:6px")}>
      <span style={s("font-size:12px;color:#0036C8;font-weight:500")}>{sectionOf(chunk)}</span>
      <p style={s(`margin:0;font-size:14px;color:#4B5568;line-height:1.6;white-space:pre-line;${clamp ? "display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden" : ""}`)}>
        <Highlighted text={passageOf(chunk)} terms={terms} />
      </p>
    </div>
  );
}

/** Bookmark toggle; the list lives on the Saved trials tab. */
export type SaveProps = { saved: Set<string>; onToggleSave: (trial: Pick<Hit, "nct_id" | "title" | "source_url">) => void };

function TrialCard({ hit, rank, terms, saved, onToggleSave }: { hit: Hit; rank: number; terms: string[] } & SaveProps) {
  const [open, setOpen] = useState(false);
  const recruiting = hit.overall_status === "RECRUITING";
  const [first, ...rest] = hit.chunks;
  const isSaved = saved.has(hit.nct_id);
  const router = useRouter();
  const { setAskDraft } = useWorkbench();
  // Opens Ask with a question about this trial in the box, not sent: the NCT ID makes Ask's search look at this trial.
  const askAI = () => {
    const title = hit.title.length > 80 ? `${hit.title.slice(0, 80).trimEnd()}…` : hit.title;
    setAskDraft(`Tell me about ${hit.nct_id} (${title}): what does it test, who can join, and where is it recruiting?`);
    router.push("/workbench/ask");
  };
  return (
    <article className="trial-card wb-in" style={s(CARD + `;gap:16px;animation-delay:${Math.min(rank, 8) * 40}ms`)}>
      <div style={s("display:flex;align-items:center;gap:8px;flex-wrap:wrap")}>
        <span style={s("width:28px;height:28px;border-radius:50%;background:#142237;color:#F7F6F2;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none")}>{rank}</span>
        <Pill fg={recruiting ? "#1F8A5B" : "#6F7684"} bg={recruiting ? "#E1F2E9" : "#ECECEE"}>{human(hit.overall_status)}</Pill>
        {hit.phases.map((phase) => <span key={phase} style={s("font-size:12px;padding:4px 10px;border-radius:999px;background:#E3E9FF;color:#0036C8")}>{PHASE_LABEL[phase] ?? human(phase)}</span>)}
        <button type="button" className="chip" aria-pressed={isSaved} onClick={() => onToggleSave(hit)} title={isSaved ? "Remove from saved trials" : "Save this trial"}
          style={s(`margin-left:auto;font-size:13px;padding:6px 12px;border-radius:999px;border:1px solid ${isSaved ? "#0045FD" : "#D6D2C6"};background:${isSaved ? "#E3E9FF" : "#FFFFFF"};color:${isSaved ? "#0036C8" : "#142237"};display:flex;align-items:center;gap:6px`)}>
          <Icon d={ICON.bookmark} size={14} fill={isSaved ? "currentColor" : "none"} />{isSaved ? "Saved" : "Save"}
        </button>
      </div>
      <h3 style={s("margin:0;font-weight:400;font-size:20px;line-height:1.3;letter-spacing:-.01em;text-wrap:pretty")}>{hit.title}</h3>
      <div style={s("display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px;color:#7A8293")}>
        <span style={s(MONO)}>{hit.nct_id}</span>
        <span style={s("display:flex;align-items:center;gap:5px")}><Icon d={ICON.calendar} size={13} />Updated {dateOf(hit.last_update_post_date)}</span>
      </div>

      {first && (
        <div style={s("border-radius:14px;background:#F7F6F2;padding:14px 16px;display:flex;flex-direction:column;gap:12px")}>
          <div style={s(LABEL)}>Why this trial came up</div>
          <Passage chunk={first} terms={terms} clamp={!open} />
          {open && rest.map((chunk) => <Passage key={chunk.id} chunk={chunk} terms={terms} clamp={false} />)}
          {(rest.length > 0 || passageOf(first).length > 280) && (
            <button type="button" onClick={() => setOpen(!open)} style={s("align-self:flex-start;border:0;background:none;padding:0;color:#0045FD;font-size:13px")}>
              {open ? "Show less" : rest.length ? `Read more (${rest.length} more passage${rest.length === 1 ? "" : "s"})` : "Read more"}
            </button>
          )}
        </div>
      )}

      <div style={s("display:flex;gap:10px;align-items:center;flex-wrap:wrap")}>
        <a href={hit.source_url} target="_blank" rel="noreferrer" className="btn-line"
          style={s("font-size:14px;display:flex;gap:6px;align-items:center;border:1px solid #D6D2C6;border-radius:999px;padding:8px 14px;color:#142237")}>
          View full trial on ClinicalTrials.gov<Icon d={ICON.source} size={13} />
        </a>
        <button type="button" className="chip" onClick={askAI} title="Open Ask with a question about this trial"
          style={s("font-size:14px;display:flex;gap:6px;align-items:center;border:1px solid #D6D2C6;border-radius:999px;padding:8px 14px;background:#FFFFFF;color:#142237")}>
          <Icon d={ICON.sparkle} size={15} color="#0045FD" />Ask AI
        </button>
        <span style={s("font-size:12px;color:#7A8293")}>Ask your care team whether it suits you.</span>
      </div>
    </article>
  );
}

/** What the search understood, in plain words. */
function Understood({ plan }: { plan: Plan }) {
  const filters = [...plan.phase.map((p) => PHASE_LABEL[p] ?? human(p)), ...(plan.sex ? [human(plan.sex)] : []), ...(plan.age != null ? [`Age ${plan.age}`] : []), ...(plan.location ? [plan.location] : []), ...plan.trial_ids];
  const topics = [...plan.conditions, ...plan.biomarkers, ...plan.stage];
  if (!filters.length && !topics.length) return null;
  return (
    <div style={s("display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:13px;color:#4B5568")}>
      {topics.length > 0 && <>Looking for {topics.map((t) => <span key={t} style={s(SOFT)}>{t}</span>)}</>}
      {filters.length > 0 && <><span style={s("margin-left:6px")}>Only</span>{filters.map((f) => <span key={f} style={s(HARD)}>{f}</span>)}</>}
    </div>
  );
}

export function Results({ response, query, stats, onDetails, ...save }: { response: SearchResponse | null; query: string; stats: Stats | null; onDetails: () => void } & SaveProps) {
  if (!response) {
    return (
      <EmptyState art={<Icon d={ICON.search} size={52} color="#D6D2C6" width={1.2} />} title="Your matching trials will appear here">
        Describe a diagnosis, treatment or biomarker in your own words, or use your profile.
        {stats && ` We search ${stats.trials.toLocaleString("en-US")} recruiting cancer trials from ClinicalTrials.gov.`}
      </EmptyState>
    );
  }
  if (response.trials_passing_hard_filters === 0) {
    return <EmptyState art={<Icon d={ICON.filter} size={48} color="#D6D2C6" width={1.2} />} title="No trials fit those filters">Try removing a filter, or widening the location or age.</EmptyState>;
  }
  if (!response.results.length) {
    return <EmptyState art={<Icon d={ICON.search} size={48} color="#D6D2C6" width={1.2} />} title="No trials matched those words">Try describing it differently, for example the diagnosis name or the treatment.</EmptyState>;
  }
  return <ResultList response={response} query={query} onDetails={onDetails} {...save} />;
}

const PAGE_SIZE = 5;

function ResultList({ response, query, onDetails, ...save }: { response: SearchResponse; query: string; onDetails: () => void } & SaveProps) {
  const [page, setPage] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  const terms = termsOf(query, response.plan);
  const pages = Math.ceil(response.results.length / PAGE_SIZE);
  const shown = response.results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const go = (next: number) => { setPage(next); top.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return (
    <div ref={top} style={s("display:flex;flex-direction:column;gap:16px;scroll-margin-top:24px")}>
      <div style={s("display:flex;flex-direction:column;gap:10px")}>
        <div style={s("display:flex;align-items:baseline;gap:12px;flex-wrap:wrap")}>
          <h2 style={s("margin:0;font-weight:400;font-size:22px;letter-spacing:-.01em")}>{response.results.length} trial{response.results.length === 1 ? "" : "s"} found</h2>
          {pages > 1 && <span style={s("font-size:13px;color:#7A8293")}>Showing {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + shown.length}</span>}
          <button type="button" onClick={onDetails} style={s("border:0;background:none;padding:0;color:#0045FD;font-size:13px")}>How we searched</button>
        </div>
        <Understood plan={response.plan} />
        {response.plan.needs_clarification && <Notice>Parts of your description weren't recognised, so results may be broad. Try naming the diagnosis or treatment.</Notice>}
      </div>
      {shown.map((hit, i) => <TrialCard key={hit.nct_id} hit={hit} rank={page * PAGE_SIZE + i + 1} terms={terms} {...save} />)}
      {pages > 1 && <Pager page={page} pages={pages} onPage={go} />}
    </div>
  );
}

function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  const step = "font-size:14px;border:1px solid #D6D2C6;border-radius:999px;padding:8px 14px;background:#FFFFFF;color:#142237;display:flex;align-items:center;gap:6px";
  return (
    <nav aria-label="Result pages" style={s("display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px")}>
      <button type="button" className="chip" disabled={page === 0} onClick={() => onPage(page - 1)} style={s(`${step};opacity:${page === 0 ? 0.4 : 1}`)}>
        <span style={s("display:flex;transform:rotate(180deg)")}><Icon d={ICON.chevron} size={14} /></span>Previous
      </button>
      {Array.from({ length: pages }, (_, n) => (
        <button key={n} type="button" aria-current={n === page ? "page" : undefined} onClick={() => onPage(n)}
          style={s(`width:38px;height:38px;border-radius:50%;font-size:14px;border:${n === page ? "0" : "1px solid #D6D2C6"};background:${n === page ? "#142237" : "#FFFFFF"};color:${n === page ? "#F7F6F2" : "#142237"}`)}>
          {n + 1}
        </button>
      ))}
      <button type="button" className="chip" disabled={page === pages - 1} onClick={() => onPage(page + 1)} style={s(`${step};opacity:${page === pages - 1 ? 0.4 : 1}`)}>
        Next<Icon d={ICON.chevron} size={14} />
      </button>
    </nav>
  );
}

export function PlanCard({ plan, query }: { plan: Plan; query: string }) {
  const hard = [...plan.status.map(human), ...plan.phase.map((p) => PHASE_LABEL[p] ?? p), ...(plan.sex ? [human(plan.sex)] : []), ...(plan.age != null ? [`age ${plan.age}`] : []), ...(plan.location ? [plan.location] : []), ...plan.trial_ids];
  const soft = [...plan.conditions, ...plan.biomarkers, ...plan.stage];
  const unbuilt = plan.intent === "patient_match" || plan.intent === "literature" || plan.intent === "compare";
  return (
    <article style={s(CARD)}>
      <div style={s("display:flex;justify-content:space-between;gap:10px;font-size:13px;color:#4B5568")}><span>What we understood</span><span style={s(`${MONO};font-size:11px`)}>intent: {plan.intent}</span></div>
      <div style={s("font-size:15px;line-height:1.4")}>“{query}”</div>
      <div>
        <div style={s(LABEL + ";margin-bottom:6px")}>Strict filters: trials that fail one are left out</div>
        <div style={s("display:flex;flex-wrap:wrap;gap:6px")}>
          {hard.length ? hard.map((value) => <span key={value} style={s(HARD)}>{value}</span>) : <span style={s("font-size:13px;color:#7A8293")}>None. Every indexed trial was considered.</span>}
        </div>
      </div>
      <div>
        <div style={s(LABEL + ";margin-bottom:6px")}>Used to rank results, not to filter</div>
        <div style={s("display:flex;flex-wrap:wrap;gap:6px")}>
          {soft.length ? soft.map((value) => <span key={value} style={s(SOFT)}>{value}</span>) : <span style={s("font-size:13px;color:#7A8293")}>No condition, biomarker or stage recognised.</span>}
        </div>
      </div>
      {plan.unknowns.length > 0 && (
        <div style={s("display:flex;flex-wrap:wrap;gap:6px")}>
          {plan.unknowns.map((unknown) => <span key={unknown} style={s("font-size:13px;padding:6px 10px;border-radius:8px;border:1px dashed #A86F0C;color:#7A500A")}>Not applied as a filter: {unknown}</span>)}
        </div>
      )}
      {plan.needs_clarification && <Notice>This query may need clarifying: nothing in it could be mapped to a condition, biomarker or NCT ID, or some wording was ambiguous.</Notice>}
      {unbuilt && <Notice>Intent “{plan.intent}” is not built; a trial search was run instead.</Notice>}
      <div style={s("font-size:12px;color:#7A8293")}>
        Results come from a dated snapshot of ClinicalTrials.gov; nothing is looked up live.{plan.freshness_required && " Your question asks for current information, so check the registry record."}
      </div>
    </article>
  );
}

export function SavedTrials({ trials, onRemove, onFind }: { trials: SavedTrial[]; onRemove: (trial: SavedTrial) => void; onFind: () => void }) {
  if (!trials.length) {
    return (
      <EmptyState art={<Icon d={ICON.bookmark} size={48} color="#D6D2C6" width={1.2} />} title="No saved trials yet">
        Press Save on any trial in <button type="button" onClick={onFind} style={s("border:0;background:none;padding:0;color:#0045FD;font-size:14px")}>Find trials</button> to keep it here.
      </EmptyState>
    );
  }
  return (
    <ul style={s("list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px")}>
      {trials.map((trial) => (
        <li key={trial.nct_id} className="wb-in" style={s(CARD + ";gap:10px")}>
          <h3 style={s("margin:0;font-weight:400;font-size:18px;line-height:1.3;text-wrap:pretty")}>{trial.title}</h3>
          <div style={s("display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px;color:#7A8293")}>
            <span style={s(MONO)}>{trial.nct_id}</span>
            <span style={s("display:flex;align-items:center;gap:5px")}><Icon d={ICON.bookmark} size={13} />Saved {dateOf(trial.created_at)}</span>
          </div>
          <div style={s("display:flex;gap:10px;align-items:center;flex-wrap:wrap")}>
            <a href={trial.source_url} target="_blank" rel="noreferrer" className="btn-line"
              style={s("font-size:14px;display:flex;gap:6px;align-items:center;border:1px solid #D6D2C6;border-radius:999px;padding:8px 14px;color:#142237")}>
              View on ClinicalTrials.gov<Icon d={ICON.source} size={13} />
            </a>
            <button type="button" onClick={() => onRemove(trial)} style={s("border:0;background:none;padding:8px 4px;color:#C8442F;font-size:14px;display:flex;align-items:center;gap:6px")}>
              <Icon d={ICON.trash} size={14} />Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
