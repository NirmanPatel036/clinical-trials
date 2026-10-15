// Data & Privacy section. Public: these pages must be readable before anyone signs up.
import Link from "next/link";

import { PrivacyNav } from "@/components/Privacy";
import { A } from "@/lib/assets";
import { s } from "@/lib/s";

// Change whenever any of the four pages changes.
const LAST_UPDATED = "15 October 2026";

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={s("min-height:100vh;background:#EEECE5;position:relative;overflow-x:clip")}>
      <div style={s("position:absolute;width:800px;height:800px;right:-300px;top:-380px;border-radius:50%;background:radial-gradient(circle,rgba(244,170,120,.4),rgba(244,170,120,0) 60%);pointer-events:none")} />
      <div style={s("position:relative;max-width:820px;margin:0 auto;padding:32px 20px 96px;display:flex;flex-direction:column;gap:24px")}>
        <header style={s("display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap")}>
          <a href="/"><img src={A["orvant-wordmark.png"]} alt="Orvant home" style={s("height:22px;width:auto;display:block")} /></a>
          <Link href="/workbench" style={s("font-size:14px")}>Open workbench</Link>
        </header>
        <div style={s("display:flex;flex-direction:column;gap:8px")}>
          <div style={s("font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.08em;color:#0045FD")}>DATA &amp; PRIVACY · LAST UPDATED {LAST_UPDATED.toUpperCase()}</div>
          <PrivacyNav />
        </div>
        <main style={s("display:flex;flex-direction:column;gap:20px;min-width:0")}>{children}</main>
        <footer style={s("font-size:13px;color:#7A8293;border-top:1px solid #D6D2C6;padding-top:16px")}>
          Trial discovery aid only. Nothing here is an eligibility decision; verify every result against the current ClinicalTrials.gov record with a clinician.
        </footer>
      </div>
    </div>
  );
}
