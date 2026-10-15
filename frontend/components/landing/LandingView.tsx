// Markup cloned from assets/Landing Page.dc.html. Values come from Landing.tsx.
import { Fragment } from "react";

import { A } from "@/lib/assets";
import { s } from "@/lib/s";

import type { LandingVals } from "./Landing";

export function LandingView(vals: LandingVals) {
  const { heroRef, howRef, critRef, dataRef, headlineA, headlineB, heroO, heroT, arcT, typed, caretO, heroChips, marquee, P0, P1, P2, P3, howIdx, howFill, rrf, nightO, crit, score, fSat, fUnk, fNa, critLabel, critCaption, strata, orbit, ledger, nTrials, nChunks, nTypes, nPatients } = vals;
  return (
<div style={s(`font-family:var(--font-neutral),system-ui,sans-serif;font-size:16px;line-height:1.5;color:#142237;background:#F7F6F2;overflow-x:clip`)}>

{/* NAV */}
<nav style={s(`position:fixed;top:14px;left:0;right:0;z-index:50;display:flex;justify-content:center;padding:0 16px;pointer-events:none`)}>
  <div style={s(`pointer-events:auto;width:100%;max-width:1180px;display:flex;align-items:center;gap:20px;padding:10px 10px 10px 20px;border-radius:999px;background:rgba(247,246,242,.72);backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4);border:1px solid rgba(20,34,55,.08)`)}>
    <img src={A["orvant-wordmark.png"]} alt="orvant" style={s(`height:22px;width:auto;display:block`)} />
    <div className="ld-navlinks" style={s(`display:flex;gap:4px;margin-left:auto;font-size:14px;flex-wrap:wrap`)}>
      <a href="#how" style={s(`color:#142237;padding:8px 12px;border-radius:999px`)} className="hv0">How it works</a>
      <a href="#criteria" style={s(`color:#142237;padding:8px 12px;border-radius:999px`)} className="hv0">Scoring</a>
      <a href="#limits" style={s(`color:#142237;padding:8px 12px;border-radius:999px`)} className="hv0">Limits</a>
      <a href="#data" style={s(`color:#142237;padding:8px 12px;border-radius:999px`)} className="hv0">Data</a>
    </div>
    <a href="/workbench" style={s(`font-size:14px;padding:9px 18px;border-radius:999px;background:#142237;color:#F7F6F2;white-space:nowrap`)} className="hv1 ld-navcta">Open workbench</a>
  </div>
</nav>

{/* HERO */}
<header ref={heroRef} data-screen-label="Hero" style={s(`position:relative;min-height:100vh;overflow:hidden;display:flex;flex-direction:column;align-items:center;padding:150px 24px 64px;background:#F7F6F2`)}>
  <div data-drift="a" style={s(`position:absolute;width:1100px;height:1100px;left:50%;top:-760px;margin-left:-550px;border-radius:50%;background:radial-gradient(circle,rgba(244,170,120,.95),rgba(244,170,120,0) 60%);filter:blur(30px)`)}></div>
  <div data-drift="b" style={s(`position:absolute;width:1300px;height:1300px;left:50%;bottom:-980px;margin-left:-650px;border-radius:50%;background:radial-gradient(circle,rgba(0,69,253,.6),rgba(0,69,253,0) 60%);filter:blur(30px)`)}></div>
  <div style={s(`position:absolute;left:0;right:0;bottom:0;height:0;display:flex;justify-content:center;transform:${arcT}`)}>
    <div style={s(`position:absolute;width:1400px;height:1400px;top:-260px;border-radius:50%;border:1px solid rgba(20,34,55,.08)`)}></div>
    <div style={s(`position:absolute;width:1120px;height:1120px;top:-200px;border-radius:50%;border:1px solid rgba(20,34,55,.10)`)}></div>
    <div style={s(`position:absolute;width:860px;height:860px;top:-150px;border-radius:50%;border:1px dashed rgba(20,34,55,.14)`)}></div>
    <div style={s(`position:absolute;width:620px;height:620px;top:-100px;border-radius:50%;border:1px solid rgba(20,34,55,.12)`)}></div>
    <img data-spin="80" src={A["orvant-mark.png"]} alt="" style={s(`position:absolute;width:150px;top:-115px`)} />
  </div>
  <div style={s(`position:absolute;inset:0;background-image:url(${A["grain.svg"]});opacity:.28;mix-blend-mode:multiply;pointer-events:none`)}></div>

  <div style={s(`position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;max-width:980px;opacity:${heroO};transform:${heroT}`)}>
    <div data-reveal="0" style={s(`display:flex;align-items:center;gap:10px;padding:6px 14px 6px 8px;border-radius:999px;background:rgba(255,255,255,.6);border:1px solid rgba(20,34,55,.08);font-size:13px;color:#4B5568`)}>
      <span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;padding:3px 8px;border-radius:999px;background:#142237;color:#F7F6F2`)}>ONCOLOGY</span>
      1,788 recruiting trials · ClinicalTrials.gov
    </div>
    {headlineA && (<>
      <h1 data-reveal="120" style={s(`margin:28px 0 0;font-weight:400;font-size:clamp(52px,9vw,116px);line-height:.95;letter-spacing:-.045em`)}>Find the trial.<br /><span style={s(`font-family:var(--font-slim),sans-serif;font-weight:300;color:#0045FD`)}>See every reason.</span></h1>
    </>)}
    {headlineB && (<>
      <h1 data-reveal="120" style={s(`margin:28px 0 0;font-weight:400;font-size:clamp(52px,9vw,116px);line-height:.95;letter-spacing:-.045em`)}>Every criterion,<br /><span style={s(`font-family:var(--font-slim),sans-serif;font-weight:300;color:#0045FD`)}>both sides cited.</span></h1>
    </>)}
    <p data-reveal="240" style={s(`margin:26px 0 0;max-width:650px;font-size:19px;color:#4B5568;text-wrap:pretty`)}>Search oncology trials in plain language, then review a patient against each trial one criterion at a time. Every patient fact behind every finding.</p>
    {/*<div data-reveal="360" style={s(`display:flex;gap:10px;margin-top:30px;flex-wrap:wrap;justify-content:center`)}>
      <a href="/workbench" style={s(`font-size:16px;padding:14px 24px;border-radius:999px;background:#0045FD;color:#FFFFFF;display:flex;align-items:center;gap:8px`)} className="hv2">Search trials<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></a>
      <a href="#criteria" style={s(`font-size:16px;padding:13px 23px;border-radius:999px;background:rgba(255,255,255,.7);border:1px solid rgba(20,34,55,.14);color:#142237`)} className="hv3">Match a patient</a>
    </div>*/}

    <div data-reveal="520" style={s(`margin-top:56px;width:100%;max-width:760px;text-align:left;background:rgba(255,255,255,.86);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:24px;padding:10px;box-shadow:0 1px 0 rgba(20,34,55,.04),0 40px 80px -40px rgba(0,69,253,.55)`)}>
      <div style={s(`display:flex;align-items:center;gap:12px;padding:10px 10px 10px 14px;border-radius:16px;background:#F7F6F2`)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0045FD" strokeWidth="1.6" strokeLinecap="round" style={s(`flex:none`)}><path d="M17.5 11a6.5 6.5 0 1 1-13 0a6.5 6.5 0 1 1 13 0Z M16 16l4.5 4.5"></path></svg>
        <span style={s(`flex:1;min-width:0;font-size:16px;min-height:24px`)}>{typed}<span style={s(`display:inline-block;width:2px;height:18px;margin-left:2px;vertical-align:-3px;background:#0045FD;opacity:${caretO}`)}></span></span>
        <span style={s(`width:38px;height:38px;border-radius:12px;background:#0045FD;display:flex;align-items:center;justify-content:center;flex:none`)}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span>
      </div>
      <div style={s(`display:flex;flex-wrap:wrap;gap:6px;padding:12px 8px 6px;min-height:42px;align-items:center`)}>
        <span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.06em;color:#7A8293;margin-right:4px`)}>PLAN</span>
        {heroChips.map((c, i) => (<Fragment key={i}>
          <span style={s(`display:flex;gap:6px;align-items:center;font-size:12.5px;padding:5px 9px;border-radius:8px;background:${c.bg};color:${c.fg};opacity:${c.o};transform:${c.t};transition:opacity .5s ease,transform .5s cubic-bezier(.2,.8,.2,1)`)}><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:9.5px;opacity:.7`)}>{c.k}</span>{c.v}</span>
        </Fragment>))}
      </div>
    </div>
  </div>
</header>

{/* MARQUEE */}
<section style={s(`position:relative;border-top:1px solid #E3E0D7;border-bottom:1px solid #E3E0D7;background:#F7F6F2;overflow:hidden;padding:22px 0`)}>
  <div style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.08em;color:#7A8293;text-align:center;margin-bottom:14px`)}>EIGHT CANCER TYPES · UP TO 250 RECRUITING TRIALS EACH</div>
  <div data-marquee="1" style={s(`display:flex;gap:56px;width:max-content;align-items:center`)}>
    {marquee.map((m, i) => (<Fragment key={i}>
      <span style={s(`display:flex;align-items:center;gap:56px;font-family:var(--font-slim),sans-serif;font-weight:300;font-size:34px;letter-spacing:-.02em;color:#142237;white-space:nowrap`)}>{m}<img src={A["orvant-mark.png"]} alt="" style={s(`width:16px;opacity:.8`)} /></span>
    </Fragment>))}
  </div>
</section>

{/* HOW (horizontal sticky) */}
<section id="how" ref={howRef} className="ld-how" data-screen-label="How it works" style={s(`position:relative;height:420vh;background:#F7F6F2`)}>
  <div style={s(`position:sticky;top:0;height:100vh;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:90px var(--how-pad) 32px`)}>
    <div style={s(`width:100%;max-width:1240px;margin:0 auto;display:flex;flex-direction:column;gap:22px`)}>
      <div style={s(`display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap`)}>
        <div style={s(`display:flex;align-items:center;gap:12px`)}><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:12px;letter-spacing:.08em;color:#0045FD`)}>HOW A SENTENCE BECOMES EVIDENCE</span></div>
        <div style={s(`display:flex;align-items:center;gap:12px;font-family:var(--font-mono),ui-monospace,monospace;font-size:12px;color:#7A8293`)}><span>{howIdx} / 04</span><span style={s(`position:relative;width:120px;height:2px;border-radius:1px;background:#E3E0D7`)}><span style={s(`position:absolute;left:0;top:0;bottom:0;border-radius:1px;background:#0045FD;width:${howFill}`)}></span></span></div>
      </div>
      <div style={s(`display:flex;height:min(620px,calc(100vh - 190px));min-height:460px`)}>
      <div onClick={P0.go} style={s(`position:relative;z-index:1;flex:${P0.f};min-width:0;margin-left:0;border-radius:24px;background:#FFFFFF;border:1px solid #E3E0D7;overflow:hidden;clip-path:inset(0 round 24px);isolation:isolate;cursor:${P0.cur};transition:flex .8s cubic-bezier(.65,0,.2,1)`)}>
        <div style={s(`position:absolute;top:0;bottom:0;left:0;width:calc(min(1240px,100vw - 2 * var(--how-pad)) - 3 * var(--how-tab));opacity:${P0.eo};transition:opacity .5s ease ${P0.d}`)}>
          <div style={s(`position:absolute;width:760px;height:760px;left:-320px;bottom:-360px;border-radius:50%;background:radial-gradient(circle at 35% 65%,rgba(236,104,52,.85),rgba(244,170,120,.7) 30%,rgba(240,180,210,.5) 48%,rgba(255,255,255,0) 66%);filter:blur(10px)`)}></div>
          <div style={s(`position:absolute;left:0;right:0;top:0;height:46%;background:linear-gradient(#FFFFFF 40%,rgba(255,255,255,0))`)}></div>
          <div style={s(`position:absolute;inset:0;background-image:url(${A["grain.svg"]});opacity:.25;mix-blend-mode:multiply`)}></div>
          <div style={s(`position:relative;padding:clamp(24px,3vw,36px);display:flex;flex-direction:column;gap:14px;max-width:620px`)}>
            <span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:13px;color:#4B5568`)}>01</span>
            <h3 style={s(`margin:0;font-weight:400;font-size:clamp(30px,3.2vw,44px);letter-spacing:-.025em;line-height:1.05`)}>Ask in a sentence</h3>
            <p style={s(`margin:0;color:#4B5568;font-size:clamp(16px,1.4vw,19px);line-height:1.45;text-wrap:pretty`)}>Type the question the way you would say it. Six worked examples are one click away.</p>
          </div>
          <div style={s(`position:absolute;left:clamp(20px,13%,170px);right:0;top:var(--how-top);bottom:0;border-radius:22px 0 0 0;background:rgba(255,255,255,.45);border:1px solid rgba(227,224,215,.9);border-right:0;border-bottom:0;padding:10px 0 0 10px;box-shadow:0 -20px 60px -30px rgba(20,34,55,.25);transform:${P0.vt};transition:transform .9s cubic-bezier(.2,.8,.2,1)`)}>
            <div style={s(`height:100%;border-radius:16px 0 0 0;background:#FBFAF7;border:1px solid #E3E0D7;border-right:0;border-bottom:0;padding:24px;overflow:hidden`)}>
              <div style={s(`width:100%;max-width:640px;display:flex;flex-direction:column;gap:14px`)}><div style={s(`background:#FFFFFF;border:1px solid #E3E0D7;border-radius:16px;padding:18px 20px;font-size:clamp(16px,1.5vw,20px);line-height:1.4`)}>phase 3 recruiting <span style={s(`color:#0045FD`)}>HER2-positive</span> breast cancer trials for women in Texas</div>
                <div style={s(`font-size:13px;color:#7A8293`)}>Try an example</div>
                <div style={s(`display:flex;flex-wrap:wrap;gap:6px`)}><span style={s(`font-size:13px;padding:7px 12px;border-radius:999px;background:#EEECE5`)}>HER2-positive breast cancer</span><span style={s(`font-size:13px;padding:7px 12px;border-radius:999px;background:#EEECE5`)}>KRAS G12C colorectal cancer</span><span style={s(`font-size:13px;padding:7px 12px;border-radius:999px;background:#EEECE5`)}>+ 4 examples</span></div></div>
            </div>
          </div>
        </div>
        <div style={s(`position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:30px 0 26px;opacity:${P0.co};pointer-events:none;transition:opacity .4s ease`)}>
          <span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:13px;color:#142237`)}>01</span>
          <div style={s(`display:flex;flex-direction:column;align-items:center;gap:22px`)}>
            <span style={s(`writing-mode:vertical-rl;transform:rotate(180deg);font-size:clamp(17px,1.5vw,20px);letter-spacing:-.01em;white-space:nowrap`)}>Ask in a sentence</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v14M2 9h14" stroke="#142237" strokeWidth="1.4" strokeLinecap="round"></path></svg>
          </div>
        </div>
      </div>
      <div onClick={P1.go} style={s(`position:relative;z-index:2;flex:${P1.f};min-width:0;margin-left:-24px;border-radius:24px;background:#FFFFFF;border:1px solid #E3E0D7;overflow:hidden;clip-path:inset(0 round 24px);isolation:isolate;cursor:${P1.cur};transition:flex .8s cubic-bezier(.65,0,.2,1)`)}>
        <div style={s(`position:absolute;top:0;bottom:0;left:0;width:calc(min(1240px,100vw - 2 * var(--how-pad)) - 3 * var(--how-tab) + 24px);opacity:${P1.eo};transition:opacity .5s ease ${P1.d}`)}>
          <div style={s(`position:absolute;width:760px;height:760px;left:-320px;bottom:-360px;border-radius:50%;background:radial-gradient(circle at 35% 65%,rgba(0,69,253,.6),rgba(120,150,255,.45) 32%,rgba(244,170,120,.3) 50%,rgba(255,255,255,0) 66%);filter:blur(10px)`)}></div>
          <div style={s(`position:absolute;left:0;right:0;top:0;height:46%;background:linear-gradient(#FFFFFF 40%,rgba(255,255,255,0))`)}></div>
          <div style={s(`position:absolute;inset:0;background-image:url(${A["grain.svg"]});opacity:.25;mix-blend-mode:multiply`)}></div>
          <div style={s(`position:relative;padding:clamp(24px,3vw,36px);display:flex;flex-direction:column;gap:14px;max-width:620px`)}>
            <span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:13px;color:#4B5568`)}>02</span>
            <h3 style={s(`margin:0;font-weight:400;font-size:clamp(30px,3.2vw,44px);letter-spacing:-.025em;line-height:1.05`)}>Read the query plan</h3>
            <p style={s(`margin:0;color:#4B5568;font-size:clamp(16px,1.4vw,19px);line-height:1.45;text-wrap:pretty`)}>Phase, status, sex, age, location and NCT IDs become strict filters. Conditions and biomarkers steer ranking only. Anything it cannot map is shown, not guessed.</p>
          </div>
          <div style={s(`position:absolute;left:clamp(20px,13%,170px);right:0;top:var(--how-top);bottom:0;border-radius:22px 0 0 0;background:rgba(255,255,255,.45);border:1px solid rgba(227,224,215,.9);border-right:0;border-bottom:0;padding:10px 0 0 10px;box-shadow:0 -20px 60px -30px rgba(20,34,55,.25);transform:${P1.vt};transition:transform .9s cubic-bezier(.2,.8,.2,1)`)}>
            <div style={s(`height:100%;border-radius:16px 0 0 0;background:#FBFAF7;border:1px solid #E3E0D7;border-right:0;border-bottom:0;padding:24px;overflow:hidden`)}>
              <div style={s(`width:100%;max-width:640px;display:flex;flex-direction:column;gap:14px`)}><div style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.06em;color:#7A8293`)}>QUERY PLAN · intent: search</div>
                <div><div style={s(`font-size:13px;color:#4B5568;margin-bottom:8px`)}>Hard filters · fail closed</div><div style={s(`display:flex;flex-wrap:wrap;gap:8px`)}><span style={s(`font-size:14px;padding:7px 12px;border-radius:10px;background:#E3E9FF;color:#0036C8`)}>PHASE3</span><span style={s(`font-size:14px;padding:7px 12px;border-radius:10px;background:#E3E9FF;color:#0036C8`)}>RECRUITING</span><span style={s(`font-size:14px;padding:7px 12px;border-radius:10px;background:#E3E9FF;color:#0036C8`)}>FEMALE</span><span style={s(`font-size:14px;padding:7px 12px;border-radius:10px;background:#E3E9FF;color:#0036C8`)}>texas</span></div></div>
                <div><div style={s(`font-size:13px;color:#4B5568;margin-bottom:8px`)}>Steers ranking only</div><div style={s(`display:flex;flex-wrap:wrap;gap:8px`)}><span style={s(`font-size:14px;padding:7px 12px;border-radius:10px;background:#FBE3D0;color:#7A4A2A`)}>breast cancer</span><span style={s(`font-size:14px;padding:7px 12px;border-radius:10px;background:#FBE3D0;color:#7A4A2A`)}>HER2</span></div></div>
                <div style={s(`font-size:13px;color:#7A8293;border-top:1px solid #EEECE5;padding-top:12px`)}>Live lookups: not used. Wording it can't map is shown as “Not applied as a filter”.</div></div>
            </div>
          </div>
        </div>
        <div style={s(`position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:30px 0 26px;opacity:${P1.co};pointer-events:none;transition:opacity .4s ease`)}>
          <span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:13px;color:#142237`)}>02</span>
          <div style={s(`display:flex;flex-direction:column;align-items:center;gap:22px`)}>
            <span style={s(`writing-mode:vertical-rl;transform:rotate(180deg);font-size:clamp(17px,1.5vw,20px);letter-spacing:-.01em;white-space:nowrap`)}>Read the query plan</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v14M2 9h14" stroke="#142237" strokeWidth="1.4" strokeLinecap="round"></path></svg>
          </div>
        </div>
      </div>
      <div onClick={P2.go} style={s(`position:relative;z-index:3;flex:${P2.f};min-width:0;margin-left:-24px;border-radius:24px;background:#FFFFFF;border:1px solid #E3E0D7;overflow:hidden;clip-path:inset(0 round 24px);isolation:isolate;cursor:${P2.cur};transition:flex .8s cubic-bezier(.65,0,.2,1)`)}>
        <div style={s(`position:absolute;top:0;bottom:0;left:0;width:calc(min(1240px,100vw - 2 * var(--how-pad)) - 3 * var(--how-tab) + 24px);opacity:${P2.eo};transition:opacity .5s ease ${P2.d}`)}>
          <div style={s(`position:absolute;width:760px;height:760px;left:-320px;bottom:-360px;border-radius:50%;background:radial-gradient(circle at 35% 65%,rgba(236,104,52,.85),rgba(244,170,120,.7) 30%,rgba(240,180,210,.5) 48%,rgba(255,255,255,0) 66%);filter:blur(10px)`)}></div>
          <div style={s(`position:absolute;left:0;right:0;top:0;height:46%;background:linear-gradient(#FFFFFF 40%,rgba(255,255,255,0))`)}></div>
          <div style={s(`position:absolute;inset:0;background-image:url(${A["grain.svg"]});opacity:.25;mix-blend-mode:multiply`)}></div>
          <div style={s(`position:relative;padding:clamp(24px,3vw,36px);display:flex;flex-direction:column;gap:14px;max-width:620px`)}>
            <span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:13px;color:#4B5568`)}>03</span>
            <h3 style={s(`margin:0;font-weight:400;font-size:clamp(30px,3.2vw,44px);letter-spacing:-.025em;line-height:1.05`)}>Two retrievers, one ranking</h3>
            <p style={s(`margin:0;color:#4B5568;font-size:clamp(16px,1.4vw,19px);line-height:1.45;text-wrap:pretty`)}>Dense and BM25 search run side by side over 10,676 registry chunks; reciprocal-rank fusion merges them into one list.</p>
          </div>
          <div style={s(`position:absolute;left:clamp(20px,13%,170px);right:0;top:var(--how-top);bottom:0;border-radius:22px 0 0 0;background:rgba(255,255,255,.45);border:1px solid rgba(227,224,215,.9);border-right:0;border-bottom:0;padding:10px 0 0 10px;box-shadow:0 -20px 60px -30px rgba(20,34,55,.25);transform:${P2.vt};transition:transform .9s cubic-bezier(.2,.8,.2,1)`)}>
            <div style={s(`height:100%;border-radius:16px 0 0 0;background:#FBFAF7;border:1px solid #E3E0D7;border-right:0;border-bottom:0;padding:24px;overflow:hidden`)}>
              <div style={s(`width:100%;max-width:640px;display:flex;flex-direction:column;gap:14px`)}><div style={s(`display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px`)}><div style={s(`background:#FFFFFF;border:1px solid #E3E0D7;border-radius:14px;padding:14px 16px`)}><div style={s(`font-size:26px;line-height:1`)}>100</div><div style={s(`font-size:12px;color:#0036C8`)}>dense chunk hits</div></div><div style={s(`background:#FFFFFF;border:1px solid #E3E0D7;border-radius:14px;padding:14px 16px`)}><div style={s(`font-size:26px;line-height:1`)}>100</div><div style={s(`font-size:12px;color:#7A4A2A`)}>BM25 chunk hits</div></div></div>
                <div style={s(`background:#142237;color:#F7F6F2;border-radius:14px;padding:16px 18px;display:flex;flex-direction:column;gap:8px`)}>
                  <div style={s(`display:flex;justify-content:space-between;font-size:13px;color:#9AA3B5`)}><span>Reciprocal-rank fusion</span><span>10 trials</span></div>
                  {rrf.map((t, i) => (<Fragment key={i}><div style={s(`display:grid;grid-template-columns:18px 108px minmax(0,1fr);gap:10px;align-items:center;font-family:var(--font-mono),ui-monospace,monospace;font-size:12px`)}><span style={s(`color:#9AA3B5`)}>{t.r}</span><span>{t.id}</span><span style={s(`height:5px;border-radius:3px;background:rgba(247,246,242,.12);position:relative`)}><span style={s(`position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:#A9BEFF;width:${t.w}`)}></span></span></div></Fragment>))}
                  <div style={s(`font-size:11.5px;color:#9AA3B5`)}>Ranking signals, not confidence or eligibility probabilities.</div>
                </div></div>
            </div>
          </div>
        </div>
        <div style={s(`position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:30px 0 26px;opacity:${P2.co};pointer-events:none;transition:opacity .4s ease`)}>
          <span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:13px;color:#142237`)}>03</span>
          <div style={s(`display:flex;flex-direction:column;align-items:center;gap:22px`)}>
            <span style={s(`writing-mode:vertical-rl;transform:rotate(180deg);font-size:clamp(17px,1.5vw,20px);letter-spacing:-.01em;white-space:nowrap`)}>Two retrievers, one ranking</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v14M2 9h14" stroke="#142237" strokeWidth="1.4" strokeLinecap="round"></path></svg>
          </div>
        </div>
      </div>
      <div onClick={P3.go} style={s(`position:relative;z-index:4;flex:${P3.f};min-width:0;margin-left:-24px;border-radius:24px;background:#FFFFFF;border:1px solid #E3E0D7;overflow:hidden;clip-path:inset(0 round 24px);isolation:isolate;cursor:${P3.cur};transition:flex .8s cubic-bezier(.65,0,.2,1)`)}>
        <div style={s(`position:absolute;top:0;bottom:0;left:0;width:calc(min(1240px,100vw - 2 * var(--how-pad)) - 3 * var(--how-tab) + 24px);opacity:${P3.eo};transition:opacity .5s ease ${P3.d}`)}>
          <div style={s(`position:absolute;width:760px;height:760px;left:-320px;bottom:-360px;border-radius:50%;background:radial-gradient(circle at 35% 65%,rgba(0,69,253,.6),rgba(120,150,255,.45) 32%,rgba(244,170,120,.3) 50%,rgba(255,255,255,0) 66%);filter:blur(10px)`)}></div>
          <div style={s(`position:absolute;left:0;right:0;top:0;height:46%;background:linear-gradient(#FFFFFF 40%,rgba(255,255,255,0))`)}></div>
          <div style={s(`position:absolute;inset:0;background-image:url(${A["grain.svg"]});opacity:.25;mix-blend-mode:multiply`)}></div>
          <div style={s(`position:relative;padding:clamp(24px,3vw,36px);display:flex;flex-direction:column;gap:14px;max-width:620px`)}>
            <span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:13px;color:#4B5568`)}>04</span>
            <h3 style={s(`margin:0;font-weight:400;font-size:clamp(30px,3.2vw,44px);letter-spacing:-.025em;line-height:1.05`)}>Open the evidence</h3>
            <p style={s(`margin:0;color:#4B5568;font-size:clamp(16px,1.4vw,19px);line-height:1.45;text-wrap:pretty`)}>Every result shows the registry text that matched, the section it came from, and a link to the source record.</p>
          </div>
          <div style={s(`position:absolute;left:clamp(20px,13%,170px);right:0;top:var(--how-top);bottom:0;border-radius:22px 0 0 0;background:rgba(255,255,255,.45);border:1px solid rgba(227,224,215,.9);border-right:0;border-bottom:0;padding:10px 0 0 10px;box-shadow:0 -20px 60px -30px rgba(20,34,55,.25);transform:${P3.vt};transition:transform .9s cubic-bezier(.2,.8,.2,1)`)}>
            <div style={s(`height:100%;border-radius:16px 0 0 0;background:#FBFAF7;border:1px solid #E3E0D7;border-right:0;border-bottom:0;padding:24px;overflow:hidden`)}>
              <div style={s(`width:100%;max-width:640px;display:flex;flex-direction:column;gap:14px`)}><article style={s(`background:#FFFFFF;border:1px solid #E3E0D7;border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:12px`)}>
                  <div style={s(`display:flex;align-items:center;gap:10px;flex-wrap:wrap`)}><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:12px;color:#4B5568`)}>NCT06551220</span><span style={s(`display:flex;align-items:center;gap:6px;font-size:12px;padding:3px 9px;border-radius:999px;background:#E1F2E9;color:#1F8A5B`)}><span style={s(`width:6px;height:6px;border-radius:50%;background:#1F8A5B`)}></span>Recruiting</span></div>
                  <div style={s(`font-size:18px;line-height:1.25;letter-spacing:-.01em`)}>Efficacy of Trastuzumab Deruxtecan in Metastatic Breast Cancer with Different HER2 Expression Patterns</div>
                  <div style={s(`display:flex`)}><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.06em;padding:3px 7px;border-radius:5px;background:#EEECE5`)}>INCLUSION_CRITERIA</span></div>
                  <p style={s(`margin:0;font-size:14px;color:#4B5568;line-height:1.55`)}>“…regardless of line of therapy, HR, and <mark>HER2 expression level</mark>; <mark>HER2 immunohistochemistry staining information</mark> of the primary lesion…”</p>
                  <div style={s(`display:flex;justify-content:space-between;align-items:center;gap:10px;border-top:1px solid #EEECE5;padding-top:12px;font-size:13px;flex-wrap:wrap`)}><a href="https://clinicaltrials.gov/study/NCT06551220">Open source record ↗</a><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;color:#7A8293`)}>data as of 2026-10-09</span></div>
                </article></div>
            </div>
          </div>
        </div>
        <div style={s(`position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:30px 0 26px;opacity:${P3.co};pointer-events:none;transition:opacity .4s ease`)}>
          <span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:13px;color:#142237`)}>04</span>
          <div style={s(`display:flex;flex-direction:column;align-items:center;gap:22px`)}>
            <span style={s(`writing-mode:vertical-rl;transform:rotate(180deg);font-size:clamp(17px,1.5vw,20px);letter-spacing:-.01em;white-space:nowrap`)}>Open the evidence</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v14M2 9h14" stroke="#142237" strokeWidth="1.4" strokeLinecap="round"></path></svg>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</section>

{/* CRITERIA (sticky, night) */}
<section id="criteria" ref={critRef} data-screen-label="Criterion review" style={s(`position:relative;height:340vh;background:#F7F6F2`)}>
  <div style={s(`position:sticky;top:0;height:100vh;overflow:hidden;display:flex;align-items:center;color:#F7F6F2`)}>
    <div style={s(`position:absolute;inset:0;background:#0B1424;opacity:${nightO}`)}></div>
    <div style={s(`position:absolute;width:1200px;height:1200px;left:-500px;top:-500px;border-radius:50%;background:radial-gradient(circle,rgba(0,69,253,.55),rgba(0,69,253,0) 60%);opacity:${nightO}`)}></div>
    <div style={s(`position:absolute;width:800px;height:800px;right:-300px;bottom:-500px;border-radius:50%;background:radial-gradient(circle,rgba(244,170,120,.35),rgba(244,170,120,0) 60%);opacity:${nightO}`)}></div>
    <img data-spin="-160" src={A["orvant-mark-light.png"]} alt="" style={s(`position:absolute;width:640px;right:-200px;top:-180px;opacity:.05`)} />
    <div style={s(`position:relative;width:100%;max-width:1240px;margin:0 auto;padding:90px 32px 40px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:40px;align-items:center;opacity:${nightO}`)}>
      <div style={s(`display:flex;flex-direction:column;gap:20px`)}>
        <div style={s(`display:flex;align-items:center;gap:12px`)}><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:12px;letter-spacing:.08em;color:#A9BEFF`)}>PATIENT MATCH</span></div>
        <h2 style={s(`margin:0;font-weight:400;font-size:clamp(40px,5vw,68px);line-height:1;letter-spacing:-.035em`)}>Every criterion,<br /><span style={s(`font-family:var(--font-slim),sans-serif;font-weight:300;color:#A9BEFF`)}>both sides of the evidence.</span></h2>
        <p style={s(`margin:0;max-width:440px;color:#B5BDCC;font-size:17px;text-wrap:pretty`)}>Rules decide age, sex, ECOG and simple lab thresholds. Two optional model judges may decide the rest, but only when they quote a patient fact verbatim. Otherwise, Unknown.</p>
        <div style={s(`display:flex;flex-direction:column;gap:12px;margin-top:8px;max-width:420px;padding:20px;border-radius:20px;background:rgba(247,246,242,.06);border:1px solid rgba(247,246,242,.12)`)}>
          <div style={s(`display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap`)}><span style={s(`font-size:13px;color:#9AA3B5`)}>Trial score</span><span style={s(`font-size:12px;padding:4px 10px;border-radius:999px;background:rgba(227,194,127,.16);color:#E3C27F`)}>{critLabel}</span></div>
          <div style={s(`display:flex;align-items:baseline;gap:4px`)}><span style={s(`font-family:var(--font-slim),sans-serif;font-weight:200;font-size:96px;line-height:.9;letter-spacing:-.04em`)}>{score}</span><span style={s(`font-size:28px;color:#9AA3B5`)}>%</span></div>
          <div style={s(`display:flex;gap:3px;height:8px`)}>
            <span style={s(`border-radius:3px;background:#3DBE84;flex:${fSat};transition:flex .5s ease`)}></span>
            <span style={s(`border-radius:3px;background:#E3C27F;flex:${fUnk};transition:flex .5s ease`)}></span>
            <span style={s(`border-radius:3px;background:rgba(247,246,242,.25);flex:${fNa};transition:flex .5s ease`)}></span>
          </div>
          <div style={s(`font-size:12px;color:#9AA3B5;line-height:1.5`)}>{critCaption}</div>
        </div>
      </div>
      <div style={s(`position:relative;display:flex;flex-direction:column;gap:8px`)}>
        {crit.map((c, i) => (<Fragment key={i}>
          <div className="ld-critrow" style={s(`display:grid;grid-template-columns:86px minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px 14px;border-radius:14px;background:${c.rowBg};border:1px solid rgba(247,246,242,.10);transition:background .5s ease`)}>
            <span style={s(`justify-self:start;font-family:var(--font-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.06em;padding:3px 7px;border-radius:5px;border:1px solid rgba(247,246,242,.4);background:${c.kindBg};color:${c.kindFg}`)}>{c.kind}</span>
            <div style={s(`min-width:0`)}><div style={s(`font-size:14px;line-height:1.35`)}>{c.text}</div><div style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;color:#9AA3B5;margin-top:3px;opacity:${c.factO};transition:opacity .5s ease`)}>{c.fact} · {c.by}</div></div>
            <span style={s(`display:flex;align-items:center;gap:6px;font-size:12px;padding:4px 10px;border-radius:999px;white-space:nowrap;background:${c.bg};color:${c.fg};transition:background .5s ease,color .5s ease`)}><span style={s(`width:6px;height:6px;border-radius:50%;background:${c.fg}`)}></span>{c.status}</span>
          </div>
        </Fragment>))}
        <div style={s(`position:absolute;left:-14px;bottom:-62px;display:flex;align-items:flex-end;gap:6px;transform:rotate(-3deg)`)}>
          <svg width="44" height="30" viewBox="0 0 44 30" fill="none"><path d="M40 28C30 26 16 18 10 4" stroke="#E3C27F" strokeWidth="1.2" strokeLinecap="round"></path><path d="M4 11l6-7 6 6" stroke="#E3C27F" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
          <span style={s(`font-family:var(--font-slim),sans-serif;font-weight:300;font-style:italic;font-size:18px;color:#E3C27F`)}>unknown is never a yes</span>
        </div>
      </div>
    </div>
  </div>
</section>

{/* PRINCIPLES */}
<section data-screen-label="Principles" style={s(`position:relative;background:#F7F6F2;padding:140px 24px 120px`)}>
  <div style={s(`max-width:1240px;margin:0 auto`)}>
    <div data-reveal="0" style={s(`display:flex;align-items:center;gap:14px;margin-bottom:22px`)}><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:12px;letter-spacing:.08em;color:#0045FD`)}>HOW IT DECIDES</span></div>
    <h2 data-reveal="80" style={s(`margin:0 0 56px;font-weight:400;font-size:clamp(36px,4.6vw,60px);line-height:1.02;letter-spacing:-.03em;max-width:860px`)}>Rules first. Models second. <span style={s(`font-family:var(--font-slim),sans-serif;font-weight:300;color:#0045FD`)}>Abstain by default.</span></h2>
    <div style={s(`display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:20px`)}>
      <article data-reveal="0" style={s(`background:#FFFFFF;border:1px solid #E3E0D7;border-radius:24px;overflow:hidden;display:flex;flex-direction:column`)} className="hv4">
        <div style={s(`position:relative;aspect-ratio:16/10;background:#FFFFFF;padding:8% 10%;display:flex;flex-direction:column;justify-content:center;gap:9px;overflow:hidden;border-bottom:1px solid #EEECE5`)}>
          <div style={s(`position:absolute;width:420px;height:420px;right:-200px;top:-220px;border-radius:50%;background:radial-gradient(circle,rgba(244,170,120,.5),rgba(244,170,120,0) 60%)`)}></div>
          {strata.map((r, i) => (<Fragment key={i}>
            <div style={s(`position:relative;display:flex;align-items:center;gap:6px`)}><span style={s(`width:7px;height:7px;border-radius:50%;flex:none;background:${r.dot}`)}></span><span style={s(`height:7px;border-radius:4px;background:#E3E0D7;width:${r.a}`)}></span><span style={s(`height:7px;border-radius:4px;background:${r.hl};width:${r.b}`)}></span><span style={s(`height:7px;border-radius:4px;background:#E3E0D7;width:${r.c}`)}></span></div>
          </Fragment>))}
          <div data-scan="1" style={s(`position:absolute;left:0;right:0;top:20%;height:40px;background:linear-gradient(rgba(0,69,253,0),rgba(0,69,253,.10),rgba(0,69,253,0));border-bottom:1px solid rgba(0,69,253,.35)`)}></div>
        </div>
        <div style={s(`padding:24px;display:flex;flex-direction:column;gap:8px`)}><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;color:#7A8293`)}>01 · RULES</span><h3 style={s(`margin:0;font-weight:400;font-size:24px;letter-spacing:-.015em`)}>Deterministic where it can be</h3><p style={s(`margin:0;color:#4B5568;font-size:15px`)}>Age, sex, ECOG and simple lab thresholds are decided by rules. Same input, same finding, every time.</p></div>
      </article>
      <article data-reveal="120" style={s(`background:#FFFFFF;border:1px solid #E3E0D7;border-radius:24px;overflow:hidden;display:flex;flex-direction:column`)} className="hv4">
        <div style={s(`position:relative;aspect-ratio:16/10;background:#EEECE5;overflow:hidden;border-bottom:1px solid #EEECE5`)}>
          <div style={s(`position:absolute;width:64%;aspect-ratio:1;left:18%;top:-2%;border-radius:50%;background:radial-gradient(circle,rgba(0,69,253,.25),rgba(0,69,253,0) 60%)`)}></div>
          <div data-spin="140" style={s(`position:absolute;left:50%;top:50%;width:44%;aspect-ratio:1;transform:translate(-50%,-50%)`)}>
            <div style={s(`position:absolute;inset:0;border-radius:50%;border:1px solid rgba(20,34,55,.16)`)}></div>
            <div style={s(`position:absolute;inset:20%;border-radius:50%;border:1px dashed rgba(20,34,55,.22)`)}></div>
            {orbit.map((o, i) => (<Fragment key={i}><span style={s(`position:absolute;left:${o.x};top:${o.y};width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:${o.c};box-shadow:0 0 0 3px #EEECE5`)}></span></Fragment>))}
          </div>
          <div style={s(`position:absolute;left:50%;top:50%;width:10%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:#142237;display:flex;align-items:center;justify-content:center`)}><img src={A["orvant-mark-light.png"]} alt="" style={s(`width:46%`)} /></div>
        </div>
        <div style={s(`padding:24px;display:flex;flex-direction:column;gap:8px`)}><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;color:#7A8293`)}>02 · JUDGES</span><h3 style={s(`margin:0;font-weight:400;font-size:24px;letter-spacing:-.015em`)}>Models must quote a fact</h3><p style={s(`margin:0;color:#4B5568;font-size:15px`)}>Optional judges decide the remaining criteria only when they cite a verbatim patient fact line. Run them on synthetic or consented data only.</p></div>
      </article>
      <article data-reveal="240" style={s(`background:#FFFFFF;border:1px solid #E3E0D7;border-radius:24px;overflow:hidden;display:flex;flex-direction:column`)} className="hv4">
        <div style={s(`position:relative;aspect-ratio:16/10;background:#F6EBD3;overflow:hidden;border-bottom:1px solid #EEECE5`)}>
          <div style={s(`position:absolute;left:50%;top:100%;width:380px;height:380px;margin:-190px 0 0 -190px;border-radius:50%;border:1px solid rgba(122,80,10,.2)`)}></div>
          <div style={s(`position:absolute;left:50%;top:100%;width:260px;height:260px;margin:-130px 0 0 -130px;border-radius:50%;border:1px dashed rgba(122,80,10,.3)`)}></div>
          <div style={s(`position:absolute;left:50%;top:100%;width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;border:1px solid rgba(122,80,10,.3)`)}></div>
          <div style={s(`position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font-family:var(--font-slim),sans-serif;font-weight:300;font-size:56px;letter-spacing:-.03em;color:#7A500A`)}>Unknown</div>
          <img src={A["orvant-mark-ink.png"]} alt="" style={s(`position:absolute;left:50%;bottom:-18px;width:44px;margin-left:-22px;opacity:.6`)} />
        </div>
        <div style={s(`padding:24px;display:flex;flex-direction:column;gap:8px`)}><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;color:#7A8293`)}>03 · ABSTAIN</span><h3 style={s(`margin:0;font-weight:400;font-size:24px;letter-spacing:-.015em`)}>No fact, no finding</h3><p style={s(`margin:0;color:#4B5568;font-size:15px`)}>Missing information stays Unknown and stays in the denominator. It can only lower a score, never raise it.</p></div>
      </article>
    </div>
  </div>
</section>

{/* LIMITS: bento from the Orvant Kit's cards section, with the kit's motion (data-spin, data-scan, data-drift) plus loops in landing.css. */}
<section id="limits" data-screen-label="Limits" style={s(`position:relative;background:#EEECE5;padding:130px 24px;overflow:hidden`)}>
  <div data-drift="a" style={s(`position:absolute;width:900px;height:900px;left:-300px;top:-400px;border-radius:50%;background:radial-gradient(circle,rgba(244,170,120,.55),rgba(244,170,120,0) 60%)`)}></div>
  <div data-drift="b" style={s(`position:absolute;width:1000px;height:1000px;right:-400px;bottom:-600px;border-radius:50%;background:radial-gradient(circle,rgba(0,69,253,.35),rgba(0,69,253,0) 60%)`)}></div>
  <div style={s(`position:absolute;inset:0;background-image:url(${A["grain.svg"]});opacity:.3;mix-blend-mode:multiply`)}></div>
  <div style={s(`position:relative;max-width:1240px;margin:0 auto;display:flex;flex-direction:column;gap:44px`)}>
    <div style={s(`display:flex;flex-direction:column;gap:18px;max-width:720px`)}>
      <span data-reveal="0" style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:12px;letter-spacing:.08em;color:#0045FD`)}>WHAT ORVANT IS, AND IS NOT</span>
      <h2 data-reveal="80" style={s(`margin:0;font-weight:400;font-size:clamp(36px,4.4vw,58px);line-height:1.02;letter-spacing:-.03em`)}>An aid for review.<br /><span style={s(`font-family:var(--font-slim),sans-serif;font-weight:300;color:#0045FD`)}>Never the decision.</span></h2>
    </div>

    <div className="bento" style={s(`display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:20px`)}>
      {/* Not an eligibility decision */}
      <article data-reveal="0" style={s(`grid-column:span 7;background:#142237;color:#F7F6F2;border-radius:20px;padding:32px;box-shadow:0 30px 60px -36px rgba(20,34,55,.6);display:flex;flex-direction:column;gap:18px;position:relative;overflow:hidden;min-height:340px`)}>
        <div style={s(`position:absolute;width:420px;height:420px;right:-160px;bottom:-200px;border-radius:50%;background:radial-gradient(circle,rgba(0,69,253,.55),rgba(0,69,253,0) 62%)`)}></div>
        <img data-spin="-120" src={A["orvant-mark-light.png"]} alt="" style={s(`position:absolute;right:-70px;top:-70px;width:260px;opacity:.08`)} />
        <span style={s(`position:relative;font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.06em;color:#9AA3B5`)}>EVERY RESULT</span>
        <div style={s(`position:relative;font-size:clamp(30px,3.2vw,44px);line-height:1.05;letter-spacing:-.025em`)}>Not an eligibility<br /><span style={s(`font-family:var(--font-slim),sans-serif;font-weight:300;color:#A9BEFF`)}>decision.</span></div>
        <p style={s(`position:relative;margin:0;color:#B5BDCC;font-size:15px;max-width:440px`)}>Every label ends in “review required”, even when every criterion is decided. The score is a share of criteria, not a probability. A clinician checks each one against the current ClinicalTrials.gov record.</p>
        <div style={s(`position:relative;display:flex;flex-wrap:wrap;gap:8px;margin-top:auto`)}>
          <span className="ld-pill" style={s(`font-size:12px;padding:5px 11px;border-radius:999px;background:#E1F2E9;color:#1F8A5B`)}>Criteria met — review required</span>
          <span className="ld-pill" style={s(`font-size:12px;padding:5px 11px;border-radius:999px;background:#F6EBD3;color:#7A500A;animation-delay:.6s`)}>Potential match — review required</span>
          <span className="ld-pill" style={s(`font-size:12px;padding:5px 11px;border-radius:999px;background:#F8E2DC;color:#C8442F;animation-delay:1.2s`)}>Likely excluded — review required</span>
        </div>
      </article>

      {/* Patient match: a live-looking criterion review under the kit's scan line */}
      <article data-reveal="80" style={s(`grid-column:span 5;background:#FFFFFF;border-radius:20px;padding:24px;box-shadow:0 1px 0 rgba(20,34,55,.04),0 30px 60px -36px rgba(20,34,55,.4);display:flex;flex-direction:column;gap:14px;position:relative;overflow:hidden`)}>
        <div style={s(`display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#4B5568`)}><span>Patient match</span><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;color:#7A8293`)}>rules · Jev · Groq</span></div>
        <div style={s(`position:relative;display:flex;flex-direction:column;border-radius:14px;border:1px solid #EEECE5;overflow:hidden`)}>
          {[["INCLUSION", "Age 18 to 80 years", "age: 61", "Met", "#1F8A5B", "#E1F2E9"],
            ["INCLUSION", "Stage II (high-risk) or III", "no fact settles this", "Unknown", "#A86F0C", "#F6EBD3"],
            ["EXCLUSION", "Prior anti-HER2 therapy", "medications: Trastuzumab", "Met · blocking", "#C8442F", "#F8E2DC"],
            ["EXCLUSION", "Pregnant or breastfeeding", "sex: MALE", "N/A", "#6F7684", "#ECECEE"]].map(([kind, criterion, fact, label, fg, bg]) => (
            <div key={criterion} style={s(`display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;padding:10px 12px;border-top:1px solid #EEECE5;margin-top:-1px`)}>
              <span style={s(`font-size:13px;line-height:1.3;min-width:0`)}><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.06em;color:#7A8293;margin-right:6px`)}>{kind}</span>{criterion}</span>
              <span style={s(`display:flex;align-items:center;gap:5px;font-size:11px;padding:3px 8px;border-radius:999px;background:${bg};color:${fg};white-space:nowrap`)}><span style={s(`width:5px;height:5px;border-radius:50%;background:${fg}`)}></span>{label}</span>
              <span style={s(`grid-column:1/-1;font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;color:${label === "Unknown" ? "#A86F0C" : "#4B5568"}`)}>{fact}</span>
            </div>
          ))}
          <div data-scan="1" style={s(`position:absolute;left:0;right:0;top:20%;height:36px;background:linear-gradient(rgba(0,69,253,0),rgba(0,69,253,.10),rgba(0,69,253,0));border-bottom:1px solid rgba(0,69,253,.35);pointer-events:none`)}></div>
        </div>
        <div style={s(`font-size:19px;letter-spacing:-.01em`)}>Judged on your facts alone.</div>
        <p style={s(`margin:0;font-size:14px;color:#4B5568`)}>A model’s answer counts only when it quotes one of your facts word for word. PubMed, codes and drug names never touch a match.</p>
      </article>

      {/* PubMed */}
      <article data-reveal="0" style={s(`grid-column:span 4;background:#FFFFFF;border-radius:20px;padding:24px;box-shadow:0 1px 0 rgba(20,34,55,.04),0 30px 60px -36px rgba(20,34,55,.4);display:flex;flex-direction:column;gap:14px`)}>
        <div style={s(`display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#4B5568`)}><span>Published research</span>
          <span style={s(`display:flex;align-items:center;gap:6px;font-size:12px;color:#0036C8`)}><span className="ld-switch" style={s(`width:26px;height:15px;border-radius:999px;position:relative`)}><span className="ld-thumb" style={s(`position:absolute;top:2px;left:2px;width:11px;height:11px;border-radius:50%;background:#FFFFFF`)}></span></span>PubMed</span></div>
        <div className="ld-paper" style={s(`border-radius:14px;border:1px solid #E3E0D7;padding:12px 14px;display:flex;flex-direction:column;gap:6px`)}>
          <span style={s(`display:flex;align-items:center;gap:6px;font-size:11.5px;color:#7A8293`)}><span style={s(`font-size:11px;padding:1px 6px;border-radius:999px;background:#F6EBD3;color:#7A500A`)}>P1</span><span style={s(`MONO`)}>PMID 39282896</span></span>
          <span style={s(`font-size:13px;line-height:1.35`)}>Trastuzumab deruxtecan after endocrine therapy in metastatic breast cancer</span>
        </div>
        <div style={s(`font-size:19px;letter-spacing:-.01em`)}>Kept apart from trial facts.</div>
        <p style={s(`margin:0;font-size:14px;color:#4B5568`)}>Abstracts from NCBI PubMed, only when you switch it on. Cited as P1, P2…, every quote checked against the abstract.</p>
      </article>

      {/* ICD-10-CM */}
      <article data-reveal="80" style={s(`grid-column:span 4;background:#FFFFFF;border-radius:20px;padding:24px;box-shadow:0 1px 0 rgba(20,34,55,.04),0 30px 60px -36px rgba(20,34,55,.4);display:flex;flex-direction:column;gap:14px`)}>
        <div style={s(`display:flex;justify-content:space-between;font-size:13px;color:#4B5568`)}><span>Diagnosis codes</span><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px`)}>ICD-10-CM · NLM</span></div>
        <div style={s(`position:relative;font-family:var(--font-mono),ui-monospace,monospace;font-size:12.5px;line-height:1.9;border-radius:14px;background:#FBFAF7;border:1px solid #EEECE5;padding:10px 14px;overflow:hidden`)}>
          <div className="ld-rowlight" style={s(`position:absolute;left:0;right:0;top:10px;height:24px;background:rgba(0,69,253,.08);border-left:2px solid #0045FD`)}></div>
          <div style={s(`position:relative`)}><span style={s(`color:#0036C8`)}>C56.1</span>  right ovary</div><div style={s(`position:relative`)}><span style={s(`color:#0036C8`)}>C56.2</span>  left ovary</div><div style={s(`position:relative`)}><span style={s(`color:#0036C8`)}>C56.9</span>  unspecified ovary</div>
        </div>
        <div style={s(`font-size:19px;letter-spacing:-.01em`)}>Listed, never picked for you.</div>
        <p style={s(`margin:0;font-size:14px;color:#4B5568`)}>Looked up only when you ask for a code. The right one depends on your record, so Orvant shows the options.</p>
      </article>

      {/* RxNorm */}
      <article data-reveal="160" style={s(`grid-column:span 4;background:#FFFFFF;border-radius:20px;padding:24px;box-shadow:0 1px 0 rgba(20,34,55,.04),0 30px 60px -36px rgba(20,34,55,.4);display:flex;flex-direction:column;gap:14px`)}>
        <div style={s(`display:flex;justify-content:space-between;font-size:13px;color:#4B5568`)}><span>Drug names</span><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px`)}>RxNorm · NLM</span></div>
        <div style={s(`display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:15px;min-height:62px`)}>
          <span style={s(`padding:6px 12px;border-radius:999px;background:#FBE3D0;color:#7A4A2A`)}>Tagrisso</span>
          <svg className="ld-nudge" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0045FD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
          <span className="ld-generic" style={s(`padding:6px 12px;border-radius:999px;background:#E3E9FF;color:#0036C8`)}>osimertinib</span>
        </div>
        <div style={s(`font-size:19px;letter-spacing:-.01em`)}>Brand names understood.</div>
        <p style={s(`margin:0;font-size:14px;color:#4B5568`)}>Ask about trials “after Tagrisso” and the search also looks for osimertinib, then tells you it did.</p>
      </article>

      {/* What leaves the server */}
      <article data-reveal="0" style={s(`grid-column:span 12;background:#FFFFFF;border-radius:20px;padding:28px 32px;box-shadow:0 1px 0 rgba(20,34,55,.04),0 30px 60px -36px rgba(20,34,55,.4);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:20px 48px;align-items:center`)}>
        <div style={s(`display:flex;flex-direction:column;gap:10px`)}>
          <div style={s(`display:flex;justify-content:space-between;font-size:13px;color:#4B5568`)}><span>What an outside search receives</span><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;color:#7A8293`)}>direct to NCBI and NLM</span></div>
          <div style={s(`font-size:clamp(17px,1.6vw,21px);line-height:1.6;border-left:2px solid #F4AA78;padding:2px 0 2px 16px`)}>
            <span className="ld-strike">I’m a 46 year old woman in Austin with</span> HER2-low breast cancer <span className="ld-strike" style={s(`animation-delay:.5s`)}>— any papers on</span> trastuzumab deruxtecan<span className="ld-strike" style={s(`animation-delay:1s`)}>?</span>
          </div>
        </div>
        <div style={s(`display:flex;flex-direction:column;gap:8px`)}>
          <div style={s(`font-size:clamp(22px,2.2vw,30px);letter-spacing:-.02em;line-height:1.1`)}>Only topic words leave.</div>
          <p style={s(`margin:0;font-size:14px;color:#4B5568;max-width:460px`)}>Ages, places, pronouns, emails and long numbers are removed first. Your profile is never sent, and no third-party hosted service sits in between.</p>
        </div>
      </article>
    </div>
  </div>
</section>

{/* DATA */}
<section id="data" ref={dataRef} data-screen-label="Data" style={s(`position:relative;background:#0B1424;color:#F7F6F2;padding:130px 24px;overflow:hidden`)}>
  <div style={s(`position:absolute;width:1100px;height:1100px;left:-460px;bottom:-700px;border-radius:50%;background:radial-gradient(circle,rgba(0,69,253,.65),rgba(0,69,253,0) 60%)`)}></div>
  <div style={s(`position:relative;max-width:1240px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:56px;align-items:center`)}>
    <div style={s(`display:flex;flex-direction:column;gap:26px`)}>
      <span data-reveal="0" style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:12px;letter-spacing:.08em;color:#A9BEFF`)}>PROVENANCE</span>
      <h2 data-reveal="80" style={s(`margin:0;font-weight:400;font-size:clamp(36px,4.4vw,58px);line-height:1.02;letter-spacing:-.03em`)}>A dated snapshot,<br /><span style={s(`font-family:var(--font-slim),sans-serif;font-weight:300;color:#A9BEFF`)}>being updated weekly.</span></h2>
      <div data-reveal="160" style={s(`display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px 24px;border-top:1px solid rgba(247,246,242,.14);padding-top:26px`)}>
        <div><div style={s(`font-family:var(--font-slim),sans-serif;font-weight:200;font-size:clamp(44px,5vw,64px);line-height:1;letter-spacing:-.03em`)}>{nTrials}</div><div style={s(`font-size:14px;color:#9AA3B5;margin-top:6px`)}>recruiting trials indexed</div></div>
        <div><div style={s(`font-family:var(--font-slim),sans-serif;font-weight:200;font-size:clamp(44px,5vw,64px);line-height:1;letter-spacing:-.03em`)}>{nChunks}</div><div style={s(`font-size:14px;color:#9AA3B5;margin-top:6px`)}>evidence chunks</div></div>
        <div><div style={s(`font-family:var(--font-slim),sans-serif;font-weight:200;font-size:clamp(44px,5vw,64px);line-height:1;letter-spacing:-.03em`)}>{nTypes}</div><div style={s(`font-size:14px;color:#9AA3B5;margin-top:6px`)}>cancer types</div></div>
        <div><div style={s(`font-family:var(--font-slim),sans-serif;font-weight:200;font-size:clamp(44px,5vw,64px);line-height:1;letter-spacing:-.03em`)}>{nPatients}</div><div style={s(`font-size:14px;color:#9AA3B5;margin-top:6px`)}>synthetic patients, no real data</div></div>
      </div>
      <div data-reveal="240" style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:12px;line-height:1.9;color:#9AA3B5`)}>ClinicalTrials.gov API v2 (2.0.5) · registry data as of 2026-10-09 09:00 · snapshot 2026-10-12</div>
    </div>
    <div data-reveal="120" style={s(`position:relative;border-radius:28px;padding:28px;background:rgba(247,246,242,.04);border:1px solid rgba(247,246,242,.10)`)}>
      <div style={s(`display:grid;grid-template-columns:repeat(20,minmax(0,1fr));gap:4px`)}>
        {ledger.map((t, i) => (<Fragment key={i}><span style={s(`aspect-ratio:1;border-radius:2px;background:${t.c};opacity:${t.o};transition:opacity .8s ease`)}></span></Fragment>))}
      </div>
      <div style={s(`display:flex;gap:18px;flex-wrap:wrap;margin-top:18px;font-size:12px;color:#9AA3B5`)}>
        <span style={s(`display:flex;gap:6px;align-items:center`)}><span style={s(`width:10px;height:10px;border-radius:2px;background:#0045FD`)}></span>retrieved</span>
        <span style={s(`display:flex;gap:6px;align-items:center`)}><span style={s(`width:10px;height:10px;border-radius:2px;background:#F4AA78`)}></span>criteria not itemised (42)</span>
        <span style={s(`display:flex;gap:6px;align-items:center`)}><span style={s(`width:10px;height:10px;border-radius:2px;background:rgba(247,246,242,.22)`)}></span>indexed</span>
      </div>
    </div>
  </div>
</section>

{/* CTA */}
<section id="start" data-screen-label="CTA" style={s(`position:relative;overflow:hidden;background:#F7F6F2;padding:150px 24px 170px;text-align:center`)}>
  <div data-drift="a" style={s(`position:absolute;width:1000px;height:1000px;left:50%;top:-640px;margin-left:-500px;border-radius:50%;background:radial-gradient(circle,rgba(244,170,120,.8),rgba(244,170,120,0) 60%);filter:blur(24px)`)}></div>
  <div data-drift="b" style={s(`position:absolute;width:1100px;height:1100px;left:50%;bottom:-820px;margin-left:-550px;border-radius:50%;background:radial-gradient(circle,rgba(0,69,253,.5),rgba(0,69,253,0) 60%);filter:blur(24px)`)}></div>
  <div style={s(`position:absolute;inset:0;background-image:url(${A["grain.svg"]});opacity:.28;mix-blend-mode:multiply`)}></div>
  <div style={s(`position:relative;max-width:820px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:26px`)}>
    <img data-reveal="0" src={A["orvant-mark.png"]} alt="" style={s(`width:56px`)} />
    <h2 data-reveal="80" style={s(`margin:0;font-weight:400;font-size:clamp(44px,6.4vw,88px);line-height:.98;letter-spacing:-.04em`)}>Start with<br /><span style={s(`font-family:var(--font-slim),sans-serif;font-weight:300;color:#0045FD`)}>a sentence.</span></h2>
    <p data-reveal="160" style={s(`margin:0;color:#4B5568;font-size:18px;max-width:520px`)}>Sign in to search. Patient matching is limited to the synthetic records your account has been granted.</p>
    <div data-reveal="240" style={s(`display:flex;gap:10px;flex-wrap:wrap;justify-content:center`)}>
      <a href="/workbench" style={s(`font-size:16px;padding:14px 24px;border-radius:999px;background:#0045FD;color:#FFFFFF`)} className="hv2">Search trials</a>
      <a href="#criteria" style={s(`font-size:16px;padding:13px 23px;border-radius:999px;background:rgba(255,255,255,.7);border:1px solid rgba(20,34,55,.14);color:#142237`)} className="hv3">How scoring works</a>
    </div>
  </div>
</section>

{/* FOOTER */}
<footer style={s(`position:relative;background:#F7F6F2;border-top:1px solid #E3E0D7;padding:64px 24px 0;overflow:hidden`)}>
  <div style={s(`max-width:1240px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:32px`)}>
    <div style={s(`display:flex;flex-direction:column;gap:14px;grid-column:span 2;max-width:440px`)}>

      <p style={s(`margin:0;font-size:13px;color:#4B5568`)}>Trial discovery aid only. Nothing here is an eligibility decision; verify every result against the current ClinicalTrials.gov record with a clinician.</p>
    </div>
    <div style={s(`display:flex;flex-direction:column;gap:8px;font-size:14px`)}><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.06em;color:#7A8293;margin-bottom:4px`)}>PRODUCT</span><a href="#how" style={s(`color:#142237`)}>Search trials</a><a href="#criteria" style={s(`color:#142237`)}>Patient match</a><a href="#data" style={s(`color:#142237`)}>System &amp; provenance</a></div>
    <div style={s(`display:flex;flex-direction:column;gap:8px;font-size:14px`)}><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.06em;color:#7A8293;margin-bottom:4px`)}>METHOD</span><a href="#criteria" style={s(`color:#142237`)}>How scoring works</a><a href="#limits" style={s(`color:#142237`)}>Evaluation &amp; limitations</a><a href="#limits" style={s(`color:#142237`)}>What it is not</a></div>
    <div style={s(`display:flex;flex-direction:column;gap:8px;font-size:14px`)}><span style={s(`font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.06em;color:#7A8293;margin-bottom:4px`)}>PRIVACY</span><a href="/privacy" style={s(`color:#142237`)}>Privacy policy</a><a href="/privacy/security" style={s(`color:#142237`)}>Data &amp; security</a><a href="/privacy/preferences" style={s(`color:#142237`)}>Consent &amp; preferences</a><a href="/privacy/requests" style={s(`color:#142237`)}>Access &amp; deletion</a></div>
  </div>
  <div style={s(`position:relative;max-width:1400px;margin:72px auto 0;height:clamp(110px,17vw,250px);overflow:hidden`)}>
    <div style={s(`position:absolute;left:10%;right:10%;bottom:-60%;height:120%;border-radius:50%;background:radial-gradient(ellipse,rgba(0,69,253,.35),rgba(0,69,253,0) 65%);filter:blur(20px)`)}></div>
    <img data-reveal="0" src={A["orvant-wordmark.png"]} alt="" style={s(`position:relative;display:block;width:100%;height:auto`)} />
  </div>
</footer>

</div>
  );
}
