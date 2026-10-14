"use client";

// Cards for the workbench's "How we searched" and "About the data" tabs: Retrieval trace, Evaluation, System.
import { useState } from "react";

import { api, ApiError, type Mode, type SearchRequest, type SearchResponse, type Stats } from "@/lib/api";
import { s } from "@/lib/s";

import { FIXED_QUERIES } from "./Search";
import { CARD, LABEL, MONO, Notice, SLIM } from "./ui";

export type SearchRun = { request: SearchRequest; response: SearchResponse; ms: number };
const MODES: Mode[] = ["dense", "bm25", "hybrid"];
const TILE = "border-radius:12px;padding:12px";
const SIGNALS = "These are ranking signals, not confidence or eligibility probabilities.";
const fixed = (value: number | null, digits: number) => (value == null ? "—" : value.toFixed(digits));

export function RetrievalTrace({ run }: { run: SearchRun | null }) {
  if (!run) return <article style={s(CARD)}><Title name="Retrieval trace" /><div style={s("font-size:14px;color:#4B5568")}>Run a search to see how its ranking was produced.</div></article>;
  const { request, response, ms } = run;
  const top = response.results[0]?.rrf_score || 1, passing = response.trials_passing_hard_filters;
  return (
    <article style={s(CARD)}>
      <Title name="Retrieval trace" detail={`${request.mode} · ${ms} ms round trip`} />
      <div style={s("display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px")}>
        <div style={s(`${TILE};background:#E3E9FF`)}><div style={s("font-size:24px;line-height:1")}>{passing ?? "all"}</div><div style={s("font-size:11px;color:#0036C8")}>trials passing hard filters</div></div>
        <div style={s(`${TILE};background:#FBE3D0`)}><div style={s("font-size:24px;line-height:1")}>{response.results.reduce((n, hit) => n + hit.chunks.length, 0)}</div><div style={s("font-size:11px;color:#7A4A2A")}>passages returned</div></div>
        <div style={s(`${TILE};background:#142237;color:#F7F6F2`)}><div style={s("font-size:24px;line-height:1")}>{response.results.length}</div><div style={s("font-size:11px;color:#9AA3B5")}>trials fused</div></div>
      </div>
      {passing === 0 && <Notice tone="red">No trial satisfies the hard filters. Nothing was retrieved; there is no unfiltered fallback.</Notice>}
      <div style={s("display:flex;flex-direction:column;gap:6px")}>
        {response.results.map((hit) => (
          <div key={hit.nct_id} style={s(`display:grid;grid-template-columns:20px 104px minmax(0,1fr) 56px;gap:10px;align-items:center;${MONO};font-size:11.5px`)}>
            <span style={s("color:#7A8293")}>{hit.fused_rank}</span><span>{hit.nct_id}</span>
            <span style={s("height:6px;border-radius:3px;background:#EEECE5;position:relative;overflow:hidden")}><span style={s(`position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:#0045FD;width:${(100 * hit.rrf_score) / top}%`)} /></span>
            <span style={s("color:#4B5568;text-align:right")} title="Reciprocal-rank fusion score">{hit.rrf_score.toFixed(4)}</span>
          </div>
        ))}
      </div>
      {response.results.length > 0 && (
        <div style={s("overflow-x:auto")}>
          <table style={s(`${MONO};font-size:11.5px;border-collapse:collapse;width:100%;text-align:left`)}>
            <thead><tr style={s("color:#7A8293")}><th style={s("font-weight:400;padding:4px 12px 4px 0")}>passage</th><th style={s("font-weight:400;padding:4px 12px")}>dense distance ↓</th><th style={s("font-weight:400;padding:4px 0")}>BM25 score ↑</th></tr></thead>
            <tbody>
              {response.results.flatMap((hit) => hit.chunks).map((chunk) => (
                <tr key={chunk.id} style={s("border-top:1px solid #EEECE5")}><td style={s("padding:4px 12px 4px 0")}>{chunk.id}</td><td style={s("padding:4px 12px")}>{fixed(chunk.dense_distance, 4)}</td><td style={s("padding:4px 0")}>{fixed(chunk.bm25_score, 2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={s("font-size:12px;color:#7A8293")}>{SIGNALS} A dash means that retriever did not return the passage. The API returns signals for the listed trials only; the full dense and BM25 hit lists stay on the server.</div>
    </article>
  );
}

function Title({ name, detail }: { name: string; detail?: string }) {
  return <div style={s("display:flex;justify-content:space-between;gap:10px;font-size:13px;color:#4B5568")}><span>{name}</span>{detail && <span style={s(`${MONO};font-size:11px`)}>{detail}</span>}</div>;
}

type Row = { query: string; top: Record<Mode, string[]> };

export function Evaluation({ onAuthLost }: { onAuthLost: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function compare() {
    setBusy(true);
    setError("");
    setRows([]);
    try {
      for (const query of FIXED_QUERIES) {
        const top = {} as Record<Mode, string[]>;
        for (const mode of MODES) top[mode] = (await api.search({ query, mode, final_k: 5 })).results.map((hit) => hit.nct_id);
        setRows((done) => [...done, { query, top }]);
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return onAuthLost();
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article style={s(CARD)}>
      <Title name="Evaluation" detail="fixed query set · top 5" />
      <div style={s("font-size:13px;color:#4B5568")}>Runs the six fixed queries in dense, BM25 and hybrid mode: 18 searches. These are side-by-side variants, not recall or precision numbers; those need a labelled gold set.</div>
      <button type="button" className="btn-line" onClick={compare} disabled={busy} style={s("align-self:flex-start;font-size:13px;border:1px solid #D6D2C6;border-radius:999px;padding:7px 14px;background:#FFFFFF")}>
        {busy ? `Comparing… ${rows.length} of ${FIXED_QUERIES.length}` : "Compare retrieval variants"}
      </button>
      {error && <Notice tone="red">{error}</Notice>}
      {rows.length > 0 && (
        <div style={s("overflow-x:auto")}>
          <table style={s("font-size:12px;border-collapse:collapse;width:100%;text-align:left")}>
            <thead><tr style={s("color:#7A8293")}>{["query", ...MODES, "dense ∩ bm25"].map((heading) => <th key={heading} style={s("font-weight:400;padding:6px 12px 6px 0")}>{heading}</th>)}</tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.query} style={s("border-top:1px solid #EEECE5;vertical-align:top")}>
                  <td style={s("padding:8px 12px 8px 0;min-width:160px")}>{row.query}</td>
                  {MODES.map((mode) => <td key={mode} style={s(`${MONO};font-size:11px;padding:8px 12px 8px 0;line-height:1.6`)}>{row.top[mode].map((id) => <div key={id}>{id}</div>)}</td>)}
                  <td style={s(`${MONO};padding:8px 0`)}>{row.top.dense.filter((id) => row.top.bm25.includes(id)).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={s("font-size:12px;color:#7A8293")}>Index smoke checks run when the index is built and are not exposed by the API; the build status is under System.</div>
    </article>
  );
}

export function System({ stats }: { stats: Stats | null }) {
  if (!stats) return <article style={s(CARD)}><Title name="System" /><div style={s("font-size:14px;color:#4B5568")}>Index statistics are unavailable.</div></article>;
  const passed = stats.build_status === "passed";
  const lines: [string, string | number | null][] = [
    ["index", stats.index_version], ["registry data as of", stats.registry_data_timestamp], ["ingested", stats.ingested_at],
    ["raw / unique", `${stats.raw_count ?? "—"} / ${stats.unique_count ?? "—"}`], ["accepted / rejected", `${stats.accepted_count ?? "—"} / ${stats.rejected_count ?? "—"}`],
    ["embedding model", stats.embedding_model], ["judge model", stats.judge_model],
  ];
  return (
    <article style={s(CARD)}>
      <div style={s("display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:13px;color:#4B5568")}>
        <span>System · index provenance</span>
        <span style={s(`display:flex;align-items:center;gap:6px;font-size:12px;color:${passed ? "#1F8A5B" : "#C8442F"}`)}><span style={s(`width:6px;height:6px;border-radius:50%;background:${passed ? "#1F8A5B" : "#C8442F"}`)} />build {stats.build_status}</span>
      </div>
      <div style={s("display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px")}>
        {([[stats.trials.toLocaleString("en-US"), "trials"], [(stats.chunk_count ?? 0).toLocaleString("en-US"), "evidence chunks"], [stats.snapshot_age_days ?? "—", "days since snapshot"]] as const).map(([value, name]) => (
          <div key={name} style={s("min-width:0")}><div style={s(`${SLIM};font-weight:300;font-size:clamp(24px,7vw,36px);line-height:1;letter-spacing:-.02em`)}>{value}</div><div style={s("font-size:12px;color:#7A8293")}>{name}</div></div>
        ))}
      </div>
      <dl style={s(`${MONO};font-size:11.5px;line-height:1.8;color:#4B5568;border-top:1px solid #EEECE5;padding-top:10px;margin:0;overflow-wrap:anywhere`)}>
        {lines.map(([name, value]) => <div key={name}><dt style={s("display:inline")}>{name} · </dt><dd style={s("display:inline;margin:0;color:#142237")}>{value ?? "not recorded"}</dd></div>)}
      </dl>
      <div style={s(LABEL)}>Source: ClinicalTrials.gov. The index is a dated snapshot; live lookups are never used.</div>
    </article>
  );
}
