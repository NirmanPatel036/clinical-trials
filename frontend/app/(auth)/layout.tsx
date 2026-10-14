// Entry screen from the Orvant Kit (07): Threshold artwork beside the form.
import { A } from "@/lib/assets";
import { s } from "@/lib/s";

export default function EntryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="entry">
      <div className="entry-art" style={s("overflow:hidden;background:#0B1424;padding:40px;display:flex;flex-direction:column;justify-content:space-between;gap:40px;color:#F7F6F2")}>
        <div style={s("position:absolute;width:900px;height:900px;left:-420px;top:-200px;border-radius:50%;background:radial-gradient(circle,rgba(0,69,253,.85),rgba(0,69,253,0) 60%);filter:blur(10px)")} />
        <div style={s("position:absolute;width:520px;height:520px;right:-220px;bottom:-280px;border-radius:50%;background:radial-gradient(circle,rgba(244,170,120,.55),rgba(244,170,120,0) 60%)")} />
        <img src={A["orvant-mark-light.png"]} alt="" style={s("position:absolute;width:520px;left:-150px;top:120px;opacity:.10")} />
        <div style={s(`position:absolute;inset:0;background-image:url(${A["grain.svg"]});opacity:.35;mix-blend-mode:screen`)} />
        <a href="/" style={s("position:relative;align-self:flex-start")}>
          <img src={A["orvant-word-light.png"]} alt="orvant" style={s("height:24px;width:auto;display:block")} />
        </a>
        <div style={s("position:relative")}>
          <div style={s("font-size:42px;line-height:1.05;letter-spacing:-.03em")}>
            Every criterion,<br />
            <span style={s("font-family:var(--font-slim),sans-serif;font-weight:300;color:#A9BEFF")}>both sides cited.</span>
          </div>
          <p style={s("margin:16px 0 0;max-width:340px;color:#B5BDCC;font-size:14px")}>Trial discovery aid only. Nothing here is an eligibility decision.</p>
        </div>
      </div>
      <div style={s("padding:56px 24px;display:flex;flex-direction:column;justify-content:center;gap:22px;max-width:520px;width:100%;justify-self:center")}>{children}</div>
    </div>
  );
}
