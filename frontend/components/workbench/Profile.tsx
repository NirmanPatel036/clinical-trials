"use client";

// The signed-in person's own details, and the trial search built from them.
import { factLines, isComplete, type Profile } from "@/lib/profile";
import { s } from "@/lib/s";

import { CARD, MONO, Notice } from "./ui";

export function ProfilePanel({ profile, busy, onFind }: { profile: Profile; busy: boolean; onFind: () => void }) {
  const { recorded, missing } = factLines(profile), complete = isComplete(profile);
  const place = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");
  return (
    <div style={s("display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:20px;align-items:start")}>
      <article style={s("background:#142237;color:#F7F6F2;border-radius:20px;padding:24px;box-shadow:0 30px 60px -36px rgba(20,34,55,.6);display:flex;flex-direction:column;gap:14px;position:relative;overflow:hidden;min-width:0")}>
        <div style={s("font-size:13px;color:#9AA3B5")}>{profile.full_name || "Your profile"} · details you entered</div>
        <div style={s(`${MONO};font-size:12.5px;line-height:1.9;overflow-wrap:anywhere`)}>
          {recorded.map((line) => <div key={line}>{line}</div>)}
          {missing.map((field) => <div key={field} style={s("color:#E3C27F")}>{field}: not recorded</div>)}
          <div style={s(place ? "" : "color:#E3C27F")}>location: {place || "not recorded"}</div>
        </div>
        <div style={s("font-size:12px;color:#9AA3B5;line-height:1.45")}>Self-reported, not a medical record. Details left blank are never guessed.</div>
      </article>
      <article style={s(CARD)}>
        <div style={s("font-size:13px;color:#4B5568")}>Trials for your profile</div>
        {complete ? (
          <div style={s("font-size:14px;color:#4B5568")}>Searches recruiting trials that accept your age and sex, ranked on your diagnosis, stage, disease status and biomarkers. Age, sex and status are strict filters; the rest only steers ranking.</div>
        ) : (
          <Notice>Add your year of birth, sex and diagnosis to search by profile.</Notice>
        )}
        <div style={s("display:flex;gap:10px;flex-wrap:wrap;align-items:center")}>
          <button type="button" className="btn-blue" onClick={onFind} disabled={!complete || busy}
            style={s(`font-size:15px;border:0;border-radius:999px;padding:12px 22px;background:#0045FD;color:#FFFFFF;opacity:${!complete || busy ? 0.5 : 1}`)}>
            {busy ? "Searching…" : "Find trials for my profile"}
          </button>
          <a href="/profile" className="btn-line" style={s("font-size:15px;border:1px solid #D6D2C6;border-radius:999px;padding:11px 21px;background:#FFFFFF;color:#142237")}>{complete ? "Edit profile" : "Complete profile"}</a>
        </div>
        <div style={s("font-size:12px;color:#7A8293")}>
          This finds candidate trials and shows the registry text behind each. To check yourself against each trial’s criteria one by one, use Patient match. Nothing here is an eligibility decision.
        </div>
      </article>
    </div>
  );
}
