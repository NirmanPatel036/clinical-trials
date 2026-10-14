// Shared pieces from the Orvant Kit: card surface, section headings, pills, icons, notices.
import { useEffect, useState } from "react";

import type { FindingStatus } from "@/lib/api";
import { s } from "@/lib/s";

export const MONO = "font-family:var(--font-mono),ui-monospace,monospace";
export const SLIM = "font-family:var(--font-slim),sans-serif";
export const CARD = "background:#FFFFFF;border-radius:20px;padding:24px;box-shadow:0 1px 0 rgba(20,34,55,.04),0 30px 60px -36px rgba(20,34,55,.4);display:flex;flex-direction:column;gap:14px;min-width:0";
export const LABEL = "font-size:11px;color:#7A8293";
export const FIELD = "border:1px solid #D6D2C6;border-radius:12px;padding:10px 12px;font-size:15px;color:#142237;background:#FFFFFF;width:100%";

export const ICON = {
  search: "M17.5 11a6.5 6.5 0 1 1-13 0a6.5 6.5 0 1 1 13 0Z M16 16l4.5 4.5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  answer: "M12 4v16M5 8l14 8M19 8L5 16",
  source: "M14 4h6v6M20 4l-9 9",
  export: "M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14",
  filter: "M4 5h16l-6 7.5V19l-4 1.5v-8Z",
  review: "M12 3l7.5 3v6c0 4.5-3.2 7.8-7.5 9-4.3-1.2-7.5-4.5-7.5-9V6Z M12 9v4M12 16v.01",
  denied: "M12 3l7.5 3v6c0 4.5-3.2 7.8-7.5 9-4.3-1.2-7.5-4.5-7.5-9V6Z M9.5 9.5l5 5M14.5 9.5l-5 5",
  user: "M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z M4.5 20a7.5 7.5 0 0 1 15 0",
  match: "M9 3.5h6v3H9Z M7 5H5v15.5h14V5h-2 M8.5 13.5l2.5 2.5 4.5-5",
  plan: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4",
  data: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  signOut: "M14 4h5v16h-5 M9.5 8L5.5 12l4 4 M5.5 12H15",
  calendar: "M5 6h14v14H5Z M5 10h14 M9 4v4 M15 4v4",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z M12 12.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Z",
  chevron: "M9 6l6 6-6 6",
  panel: "M4 5h16v14H4Z M9.5 5v14",
  chat: "M4.5 5.5h15v10h-9l-4.5 4v-4h-1.5Z",
  // AI: one large four-point sparkle and a small one.
  sparkle: "M10 3.5l1.7 4.8 4.8 1.7-4.8 1.7L10 16.5l-1.7-4.8L3.5 10l4.8-1.7Z M18 14l.9 2.1 2.1.9-2.1.9L18 20l-.9-2.1L15 17l2.1-.9Z",
  bookmark: "M7 4h10v16l-5-4-5 4Z",
  plus: "M12 5v14M5 12h14",
  trash: "M5 7h14M10 7V4.5h4V7M7 7l1 12.5h8L17 7",
  history: "M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.5H8M12 8v4l2.5 2",
};

export const PHASE_LABEL: Record<string, string> = { EARLY_PHASE1: "Early phase 1", PHASE1: "Phase 1", PHASE2: "Phase 2", PHASE3: "Phase 3", PHASE4: "Phase 4", NA: "No phase" };

export const FINDING: Record<FindingStatus, { label: string; fg: string; bg: string }> = {
  met: { label: "Met", fg: "#1F8A5B", bg: "#E1F2E9" },
  not_met: { label: "Not met", fg: "#C8442F", bg: "#F8E2DC" },
  unknown: { label: "Unknown", fg: "#A86F0C", bg: "#F6EBD3" },
  not_applicable: { label: "Not applicable", fg: "#6F7684", bg: "#ECECEE" },
};

/** "NOT_YET_RECRUITING" -> "Not yet recruiting". */
export const human = (value: string) => value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");

export function Icon({ d, size = 16, color = "currentColor", width = 1.8, fill = "none" }: { d: string; size?: number; color?: string; width?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
      <path d={d} />
    </svg>
  );
}

export function Eyebrow({ id, children }: { id?: string; children: React.ReactNode }) {
  return <h2 id={id} style={s(`${MONO};margin:36px 0 14px;font-weight:400;font-size:12px;letter-spacing:.08em;color:#0045FD;text-transform:uppercase`)}>{children}</h2>;
}

/** Title block at the top of each workbench tab. */
export function PageHead({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <header style={s("display:flex;flex-direction:column;gap:8px;margin-bottom:24px")}>
      {kicker && <div style={s("font-size:14px;color:#4B5568")}>{kicker}</div>}
      <h1 style={s("margin:0;font-weight:400;font-size:34px;letter-spacing:-.025em;line-height:1.1")}>{title}</h1>
      {children && <p style={s("margin:0;font-size:15px;color:#4B5568;max-width:640px")}>{children}</p>}
    </header>
  );
}

export function Pill({ fg, bg, children }: { fg: string; bg: string; children: React.ReactNode }) {
  return (
    <span style={s(`display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:4px 10px;border-radius:999px;background:${bg};color:${fg}`)}>
      <span style={s(`width:6px;height:6px;border-radius:50%;flex:none;background:${fg}`)} />
      {children}
    </span>
  );
}

export function Notice({ children, tone = "amber" }: { children: React.ReactNode; tone?: "amber" | "red" }) {
  const [bg, fg] = tone === "red" ? ["#F8E2DC", "#C8442F"] : ["#F6EBD3", "#7A500A"];
  return (
    <div role={tone === "red" ? "alert" : "note"} style={s(`display:flex;align-items:flex-start;gap:8px;font-size:13px;padding:10px 12px;border-radius:12px;background:${bg};color:${fg}`)}>
      <Icon d={ICON.review} />
      <span>{children}</span>
    </div>
  );
}

/** Kit empty state: a fragment of artwork, a plain title, what happened. */
export function EmptyState({ art, title, children, dark }: { art: React.ReactNode; title: string; children: React.ReactNode; dark?: boolean }) {
  const surface = dark ? "background:#0B1424;color:#F7F6F2" : "background:#FFFFFF;border:1px solid #E3E0D7";
  return (
    <div style={s(`${surface};border-radius:24px;padding:28px;display:flex;flex-direction:column;gap:14px;position:relative;overflow:hidden`)}>
      {dark && <div style={s("position:absolute;width:300px;height:300px;left:-100px;top:-160px;border-radius:50%;background:radial-gradient(circle,rgba(0,69,253,.7),rgba(0,69,253,0) 60%)")} />}
      <div style={s("height:110px;position:relative;display:flex;align-items:center;justify-content:center")}>{art}</div>
      <div style={s("position:relative;font-size:19px")}>{title}</div>
      <div style={s(`position:relative;font-size:14px;color:${dark ? "#B5BDCC" : "#4B5568"}`)}>{children}</div>
    </div>
  );
}

export function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: readonly (readonly [T, string])[]; value: T; onChange: (value: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} style={s("display:inline-flex;padding:3px;border-radius:19px;background:#EEECE5;font-size:13px;flex-wrap:wrap")}>
      {options.map(([option, text]) => (
        <button key={option} type="button" role="radio" aria-checked={option === value} onClick={() => onChange(option)}
          style={s(option === value ? "border:0;padding:7px 14px;border-radius:999px;background:#FFFFFF;box-shadow:0 1px 2px rgba(20,34,55,.12)" : "border:0;padding:7px 14px;border-radius:999px;background:transparent;color:#4B5568")}>
          {text}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={s("display:flex;flex-direction:column;gap:6px;font-size:13px;color:#4B5568;min-width:0")}>
      {label}
      {children}
      {hint && <span style={s("font-size:12px;color:#7A8293")}>{hint}</span>}
    </label>
  );
}

const STAGGER = 55;

/** Cycles through sentences; each word flips out in turn and the next sentence's words flip in behind it. */
export function FlipText({ lines, every = 2400 }: { lines: string[]; every?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setN((x) => x + 1), every);
    return () => clearInterval(timer);
  }, [every]);
  const words = (line: string, delay: number) => line.split(" ").map((word, i) => <span key={i} className="flip-word" style={{ animationDelay: `${delay + i * STAGGER}ms` }}>{word}</span>);
  return (
    <span className="flip">
      {n > 0 && <span key={`out${n}`} className="flip-line flip-out" aria-hidden>{words(lines[(n - 1) % lines.length], 0)}</span>}
      <span key={`in${n}`} className="flip-line">{words(lines[n % lines.length], n > 0 ? 140 : 0)}</span>
    </span>
  );
}
