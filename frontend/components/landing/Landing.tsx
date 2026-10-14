"use client";

// Scroll and motion logic ported from assets/Landing Page.dc.html.
import { Component, createRef } from "react";

import "./landing.css";
import { LandingView } from "./LandingView";

const QUERY = "phase 3 recruiting HER2-positive breast cancer trials for women in Texas";
const clamp = (value: number) => Math.max(0, Math.min(1, value));

type State = { heroP: number; howP: number; critP: number; critEnter: number; typed: string; chips: number; caret: number; count: number; ledgerOn: boolean };
type Scroll = Pick<State, "heroP" | "howP" | "critP" | "critEnter">;
export type LandingVals = ReturnType<Landing["renderVals"]>;

export default class Landing extends Component<object, State> {
  state: State = { heroP: 0, howP: 0, critP: 0, critEnter: 0, typed: "", chips: 0, caret: 1, count: 0, ledgerOn: false };
  heroRef = createRef<HTMLElement>();
  howRef = createRef<HTMLElement>();
  critRef = createRef<HTMLElement>();
  dataRef = createRef<HTMLElement>();
  private anims: Animation[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  private reveals = new Map<Element, Animation>();
  private observers: IntersectionObserver[] = [];
  private blink?: ReturnType<typeof setInterval>;
  private raf = 0;

  private onScroll = () => {
    if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.measure(); });
  };

  componentDidMount() {
    window.addEventListener("scroll", this.onScroll, { passive: true, capture: true });
    window.addEventListener("resize", this.onScroll);
    this.measure();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.setState({ typed: QUERY, chips: 6, count: 1, ledgerOn: true });
      return;
    }
    const each = (selector: string, run: (el: HTMLElement) => void) => document.querySelectorAll<HTMLElement>(selector).forEach(run);
    each("[data-spin]", (el) => {
      const seconds = parseFloat(el.dataset.spin!) || 90, pre = el.style.transform || "";
      this.anims.push(el.animate([{ transform: `${pre} rotate(0deg)` }, { transform: `${pre} rotate(${seconds < 0 ? -360 : 360}deg)` }], { duration: Math.abs(seconds) * 1000, iterations: Infinity }));
    });
    each("[data-scan]", (el) => this.anims.push(el.animate([{ top: "4%" }, { top: "76%" }], { duration: 5200, iterations: Infinity, direction: "alternate", easing: "ease-in-out" })));
    each("[data-drift]", (el) => {
      const b = el.dataset.drift === "b";
      this.anims.push(el.animate([{ transform: "translate(0,0) scale(1)" }, { transform: b ? "translate(-60px,-30px) scale(1.08)" : "translate(70px,20px) scale(1.06)" }], { duration: b ? 14000 : 11000, iterations: Infinity, direction: "alternate", easing: "ease-in-out" }));
    });
    each("[data-marquee]", (el) => this.anims.push(el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }], { duration: 48000, iterations: Infinity })));

    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { this.reveals.get(entry.target)?.play(); io.unobserve(entry.target); }
    }), { threshold: 0.12 });
    each("[data-reveal]", (el) => {
      const reveal = el.animate([{ opacity: 0, transform: "translateY(28px)", filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }],
        { duration: 1000, delay: parseFloat(el.dataset.reveal!) || 0, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
      reveal.pause();
      this.reveals.set(el, reveal);
      io.observe(el);
    });
    this.timers.push(setTimeout(() => this.playReveals(), 60));
    // Safety net: nothing stays hidden if an observer never fires.
    this.timers.push(setTimeout(() => this.playReveals(true), 4000));

    const dio = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) { dio.disconnect(); this.countUp(); } }, { threshold: 0.3 });
    if (this.dataRef.current) dio.observe(this.dataRef.current);
    this.observers = [io, dio];

    let i = 0;
    const type = () => {
      i++;
      this.setState({ typed: QUERY.slice(0, i) });
      if (i < QUERY.length) this.timers.push(setTimeout(type, 28 + Math.random() * 40));
      else this.showChips(0);
    };
    this.timers.push(setTimeout(type, 900));
    this.blink = setInterval(() => this.setState((state) => ({ caret: state.caret ? 0 : 1 })), 530);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.onScroll, { capture: true });
    window.removeEventListener("resize", this.onScroll);
    cancelAnimationFrame(this.raf);
    this.anims.forEach((anim) => anim.cancel());
    this.reveals.forEach((anim) => anim.cancel());
    this.timers.forEach(clearTimeout);
    clearInterval(this.blink);
    this.observers.forEach((observer) => observer.disconnect());
  }

  playReveals(all = false) {
    const vh = window.innerHeight;
    this.reveals.forEach((anim, el) => {
      if (anim.playState !== "paused") return;
      const rect = el.getBoundingClientRect();
      if (all || (rect.top < vh * 0.95 && rect.bottom > 0)) anim.play();
    });
  }

  showChips(n: number) {
    this.setState({ chips: n });
    if (n < 6) this.timers.push(setTimeout(() => this.showChips(n + 1), 260));
  }

  countUp() {
    const start = performance.now();
    this.setState({ ledgerOn: true });
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / 1600);
      this.setState({ count: 1 - Math.pow(1 - t, 3) });
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  measure() {
    this.playReveals();
    const vh = window.innerHeight;
    const hero = this.heroRef.current?.getBoundingClientRect(), how = this.howRef.current?.getBoundingClientRect(), crit = this.critRef.current?.getBoundingClientRect();
    const next: Partial<Scroll> = {};
    if (hero) next.heroP = clamp(-hero.top / hero.height);
    if (how) next.howP = clamp(-how.top / (how.height - vh));
    if (crit) { next.critP = clamp(-crit.top / (crit.height - vh)); next.critEnter = clamp((vh - crit.top) / (vh * 0.9)); }
    const changed = (Object.keys(next) as (keyof Scroll)[]).some((key) => Math.abs(this.state[key] - next[key]!) > 0.002);
    if (changed) this.setState(next as Scroll);
  }

  goStep(i: number) {
    const el = this.howRef.current;
    if (!el) return;
    const vh = window.innerHeight, rect = el.getBoundingClientRect(), scroller = document.scrollingElement || document.documentElement;
    scroller.scrollTo({ top: scroller.scrollTop + rect.top + (rect.height - vh) * ((i + 0.5) / 4), behavior: "smooth" });
  }

  renderVals() {
    const state = this.state;
    const step = Math.min(3, Math.floor(state.howP * 4 * 0.999));
    const panel = (i: number) => {
      const on = i === step;
      return { f: on ? "1 1 0px" : `0 0 calc(var(--how-tab) + ${i ? 24 : 0}px)`, eo: on ? 1 : 0, co: on ? 0 : 1, d: on ? ".3s" : "0s",
        vt: on ? "translate(0,0)" : "translate(60px,40px)", cur: on ? "default" : "pointer", go: () => this.goStep(i) };
    };
    const chipDefs: [string, string, boolean][] = [["PHASE", "PHASE3", true], ["STATUS", "RECRUITING", true], ["SEX", "FEMALE", true], ["IN", "texas", true], ["RANKS", "breast cancer", false], ["RANKS", "HER2", false]];
    const heroChips = chipDefs.map(([k, v, hard], i) => ({ k, v, bg: hard ? "#E3E9FF" : "#FBE3D0", fg: hard ? "#0036C8" : "#7A4A2A", o: i < state.chips ? 1 : 0, t: i < state.chips ? "translateY(0)" : "translateY(8px)" }));

    const ST: Record<string, [string, string, string]> = {
      met: ["Met", "#3DBE84", "rgba(61,190,132,.14)"], not: ["Not met", "#F08C7A", "rgba(240,140,122,.14)"], unk: ["Unknown", "#E3C27F", "rgba(227,194,127,.14)"],
      na: ["Not applicable", "#B5BDCC", "rgba(247,246,242,.08)"], pend: ["Reviewing", "#6C7690", "rgba(247,246,242,.04)"],
    };
    // kind, criterion, patient fact, judged by, status, effect on the score
    const rows = [
      ["INCLUSION", "Age 18 to 80 years (registry field)", "age: 61", "Rule", "met", "sat"],
      ["INCLUSION", "Sex: FEMALE (registry field)", "sex: FEMALE", "Rule", "met", "sat"],
      ["INCLUSION", "Advanced or locally unresectable breast cancer", "stage: Stage IV", "Groq", "met", "sat"],
      ["INCLUSION", "HER2 immunohistochemistry staining information available", "biomarkers: HER2 positive", "Jev · 0.96", "met", "sat"],
      ["INCLUSION", "Treated with T-DXd regardless of line of therapy", "no patient evidence", "abstained", "unk", "unk"],
      ["INCLUSION", "Measurable lesions evaluable through imaging", "no patient evidence", "abstained", "unk", "unk"],
      ["EXCLUSION", "Missing basic clinical information or HER2 staining", "diagnosis: Malignant neoplasm of breast", "Jev · 0.93", "not", "sat"],
      ["EXCLUSION", "Lost to follow-up after T-DXd treatment", "no prior T-DXd recorded", "Groq", "na", "na"],
    ];
    const decided = Math.min(rows.length, Math.floor(state.critP * (rows.length + 1.2)));
    let sat = 0, unk = 0, na = 0;
    const crit = rows.map(([kind, text, fact, by, status, effect], i) => {
      const done = i < decided, [label, fg, bg] = ST[done ? status : "pend"], exclusion = kind === "EXCLUSION";
      if (done && effect === "sat") sat++; else if (done && effect === "na") na++; else unk++;
      return { kind, text, fact, by, status: done && exclusion && status === "not" ? "Not met · satisfied" : label, fg, bg, factO: done ? 1 : 0,
        rowBg: done ? "rgba(247,246,242,.06)" : "rgba(247,246,242,.02)", kindBg: exclusion ? "#F7F6F2" : "rgba(0,0,0,0)", kindFg: exclusion ? "#0B1424" : "#F7F6F2" };
    });
    const applicable = rows.length - na;

    const ledger = Array.from({ length: 160 }, (_, i) => {
      const h = (i * 73 + 11) % 157;
      return { c: h < 10 ? "#0045FD" : h < 14 ? "#F4AA78" : h < 70 ? "rgba(247,246,242,.22)" : "rgba(247,246,242,.09)", o: state.ledgerOn ? 1 : h < 14 ? 0 : 0.4 };
    });
    const highlights = ["#1F8A5B", "#E3E0D7", "#A86F0C", "#1F8A5B", "#C8442F", "#0045FD", "#1F8A5B"];
    const strata = highlights.map((hl, i) => ({ a: `${10 + ((i * 37) % 30)}%`, b: `${12 + ((i * 23) % 22)}%`, c: `${8 + ((i * 41) % 26)}%`, hl, dot: hl === "#E3E0D7" ? "#D6D2C6" : hl }));
    const orbitDefs: [number, number, string][] = [[0, 50, "#1F8A5B"], [55, 50, "#1F8A5B"], [130, 50, "#A86F0C"], [210, 30, "#1F8A5B"], [280, 30, "#C8442F"], [330, 50, "#6F7684"]];
    const orbit = orbitDefs.map(([degrees, radius, c]) => {
      const t = (degrees * Math.PI) / 180;
      // Rounded so server and browser render the same string.
      return { x: `${(50 + radius * Math.cos(t)).toFixed(3)}%`, y: `${(50 + radius * Math.sin(t)).toFixed(3)}%`, c };
    });
    const types = ["Breast", "Lung", "Melanoma", "Colorectal", "Prostate", "Pancreatic", "Leukemia", "Ovarian"];
    const count = (total: number) => Math.round(total * state.count).toLocaleString("en-US");

    return {
      heroRef: this.heroRef, howRef: this.howRef, critRef: this.critRef, dataRef: this.dataRef,
      headlineA: true, headlineB: false,
      heroO: 1 - state.heroP * 1.1, heroT: `translateY(${-state.heroP * 80}px)`,
      arcT: `translateY(${state.heroP * 160}px) scale(${1 + state.heroP * 0.25})`,
      typed: state.typed, caretO: state.caret, heroChips,
      marquee: types.concat(types),
      P0: panel(0), P1: panel(1), P2: panel(2), P3: panel(3), howIdx: `0${step + 1}`,
      howFill: `${state.howP * 100}%`,
      rrf: [{ r: "1", id: "NCT06551220", w: "100%" }, { r: "2", id: "NCT05318274", w: "76%" }, { r: "3", id: "NCT0•••••••", w: "61%" }, { r: "4", id: "NCT0•••••••", w: "48%" }],
      nightO: state.critEnter, crit, score: applicable ? Math.round((100 * sat) / applicable) : 0,
      fSat: sat || 0.001, fUnk: unk || 0.001, fNa: na || 0.001,
      critLabel: decided >= rows.length ? "Potential match: review required" : `Reviewing ${decided} of ${rows.length}`,
      critCaption: `${sat} satisfied, 0 blocking, ${unk} unknown of ${applicable} applicable criteria; ${na} not applicable. A share of criteria, not a probability of eligibility.`,
      strata, orbit,
      ledger,
      nTrials: count(1788), nChunks: count(10676), nTypes: count(8), nPatients: count(80),
    };
  }

  render() {
    return <LandingView {...this.renderVals()} />;
  }
}
