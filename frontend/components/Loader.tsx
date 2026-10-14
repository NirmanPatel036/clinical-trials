// The app's loader: the Orvant mark inside a spinning ring, with status-coloured dots in orbit (from the brand kit).
// Works as a Server Component, so app/loading.tsx can show it before any client code runs.
import { A } from "@/lib/assets";
import { s } from "@/lib/s";

/** full covers the screen (route loads, session checks); otherwise it fills the workbench's content area. */
export function Loader({ label = "Loading", full = true }: { label?: string; full?: boolean }) {
  return (
    <div role="status" aria-live="polite" style={s(`min-height:${full ? "100vh" : "60vh"};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:${full ? "#F7F6F2" : "transparent"}`)}>
      <div style={s("position:relative;width:88px;height:88px")}>
        <div className="orv-loader-ring" style={s("position:absolute;inset:0;border-radius:50%;border:2px solid #E3E9FF;border-top-color:#0045FD")} />
        <div className="orv-loader-orbit" style={s("position:absolute;inset:-10px;border-radius:50%;border:1px dashed rgba(20,34,55,.18)")}>
          <span style={s("position:absolute;left:50%;top:-4px;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:#1F8A5B")} />
          <span style={s("position:absolute;right:4px;bottom:14px;width:8px;height:8px;border-radius:50%;background:#A86F0C")} />
          <span style={s("position:absolute;left:4px;bottom:14px;width:8px;height:8px;border-radius:50%;background:#F4AA78")} />
        </div>
        <img className="orv-loader-mark" src={A["orvant-mark.png"]} alt="" style={s("position:absolute;left:50%;top:50%;width:34px;margin:-17px 0 0 -17px")} />
      </div>
      <span style={s("font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.08em;color:#7A8293")}>{label.toUpperCase()}…</span>
    </div>
  );
}
