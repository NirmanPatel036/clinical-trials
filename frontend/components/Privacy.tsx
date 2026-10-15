"use client";

// Data & Privacy pages: shared shell pieces, plus the two interactive panels (device settings, your account data).
// Every statement on these pages is checked against the code; see PRIVACY_PAGE_REVIEW.md before changing one.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CARD, ICON, Icon, MONO, Notice, PageHead } from "@/components/workbench/ui";
import { hasSecondFactor } from "@/lib/profile";
import { s } from "@/lib/s";
import { supabase } from "@/lib/supabase";

export const PAGES = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/privacy/security", label: "Data & security" },
  { href: "/privacy/preferences", label: "Consent & preferences" },
  { href: "/privacy/requests", label: "Access & deletion" },
];

export function PrivacyNav() {
  const path = usePathname();
  const nav = useRef<HTMLElement>(null);
  // On phones the tabs scroll sideways; keep the current one in view.
  useEffect(() => { nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" }); }, [path]);
  return (
    <nav ref={nav} aria-label="Data and privacy" className="pv-nav">
      {PAGES.map((p) => (
        <Link key={p.href} href={p.href} className="pv-tab" aria-current={path === p.href ? "page" : undefined}>{p.label}</Link>
      ))}
    </nav>
  );
}

// The pages are server components; ui.tsx is client-only, so its heading is passed through here.
export const Title = (props: Parameters<typeof PageHead>[0]) => <PageHead {...props} />;

export const EMAIL = "nirman0511@gmail.com";
export const Contact = () => <a href={`mailto:${EMAIL}`}>{EMAIL}</a>;

export function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={id && `${id}-h`} style={s(CARD)}>
      <h2 id={id && `${id}-h`} style={s("margin:0;font-weight:400;font-size:22px;letter-spacing:-.01em")}>{title}</h2>
      <div className="pv-body">{children}</div>
    </section>
  );
}

/** Label / value rows that stack on narrow screens. */
export function Rows({ rows }: { rows: [React.ReactNode, React.ReactNode][] }) {
  return (
    <dl className="pv-rows">
      {rows.map(([term, detail], i) => (
        <div key={i}><dt>{term}</dt><dd>{detail}</dd></div>
      ))}
    </dl>
  );
}

export function DecisionSupport() {
  return (
    <Notice>
      Orvant is a decision-support tool for finding and reviewing clinical trials. A match result is not a medical diagnosis, a treatment recommendation or a confirmation that
      anyone is eligible for a trial. Check every result against the current ClinicalTrials.gov record with a clinician.
    </Notice>
  );
}

// The keys Orvant itself writes to this browser's localStorage (see components/workbench/Chat.tsx and app/workbench/layout.tsx).
const DEVICE_KEYS = ["chat-literature", "chat-model", "sidebar-collapsed"];
const isOrvantKey = (key: string) => DEVICE_KEYS.includes(key) || key.startsWith("fingerprint-offer-dismissed:");

/** The device-level settings that exist: the PubMed switch Ask reads, and clearing what Orvant stored here. */
export function DeviceSettings() {
  const [literature, setLiterature] = useState<boolean | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  useEffect(() => { setLiterature(localStorage.getItem("chat-literature") === "1"); setModel(localStorage.getItem("chat-model")); }, []);
  const toggle = () => { localStorage.setItem("chat-literature", literature ? "0" : "1"); setLiterature(!literature); setCleared(false); };
  const clear = () => {
    Object.keys(localStorage).filter(isOrvantKey).forEach((key) => localStorage.removeItem(key));
    setLiterature(false); setModel(null); setCleared(true);
  };
  return (
    <div style={s("display:flex;flex-direction:column;gap:18px")}>
      <div style={s("display:flex;gap:14px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap")}>
        <div style={s("flex:1;min-width:240px")}>
          <div id="pubmed-label" style={s("font-size:15px")}>Search PubMed from Ask</div>
          <p id="pubmed-desc" style={s("margin:4px 0 0;font-size:14px;color:#4B5568")}>
            When on, each Ask question’s topic words are also sent to the U.S. National Library of Medicine’s PubMed search. A question that asks for papers or
            literature searches PubMed even when this is off.
          </p>
        </div>
        <button type="button" role="switch" aria-checked={Boolean(literature)} aria-labelledby="pubmed-label" aria-describedby="pubmed-desc" disabled={literature === null} onClick={toggle}
          style={s(`font-size:14px;padding:6px 4px;border:0;background:none;color:${literature ? "#0036C8" : "#4B5568"};display:flex;align-items:center;gap:8px`)}>
          <span aria-hidden className="switch-track" style={s(`position:relative;width:32px;height:18px;border-radius:999px;flex:none;background:${literature ? "#0045FD" : "#D6D2C6"}`)}>
            <span className="switch-thumb" style={s(`position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#FFFFFF;box-shadow:0 1px 2px rgba(20,34,55,.25);transform:translateX(${literature ? 14 : 0}px)`)} />
          </span>
          {literature ? "On" : "Off"}
        </button>
      </div>
      <div style={s("font-size:14px;color:#4B5568;border-top:1px solid #EEECE5;padding-top:16px")}>
        Answer model remembered on this device: <span style={s(`${MONO};font-size:13px;color:#142237`)}>{model ?? "none (Gemini is the default)"}</span>. Change it with the model
        picker in <Link href="/workbench/ask">Ask</Link>; the model you pick is the company your question is sent to.
      </div>
      <div style={s("display:flex;gap:12px;align-items:center;flex-wrap:wrap;border-top:1px solid #EEECE5;padding-top:16px")}>
        <button type="button" className="btn-line" onClick={clear}
          style={s("font-size:14px;border:1px solid #D6D2C6;border-radius:999px;padding:10px 18px;background:#FFFFFF;color:#142237")}>Clear Orvant settings on this device</button>
        <span role="status" style={s("font-size:13px;color:#1F8A5B")}>{cleared ? "Cleared. Your sign-in on this device is unchanged." : ""}</span>
      </div>
    </div>
  );
}

type Account = { id: string; email: string } | "signed-out" | "needs-mfa" | null;

/** Download, and the deletions the database lets an account make itself: Ask conversations and saved trials. */
export function AccountData() {
  const [account, setAccount] = useState<Account>(null);
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirming, setConfirming] = useState<"conversations" | "saved" | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return setAccount("signed-out");
      if (!(await hasSecondFactor())) return setAccount("needs-mfa");
      setAccount({ id: data.session.user.id, email: data.session.user.email ?? "" });
    })().catch(() => setAccount("signed-out"));
  }, []);

  async function run(label: string, work: () => Promise<string>) {
    setBusy(label); setResult(null);
    try {
      setResult({ ok: true, text: await work() });
    } catch (caught) {
      setResult({ ok: false, text: `That didn’t work: ${(caught as { message?: string })?.message ?? String(caught)}. Nothing else was changed.` });
    } finally {
      setBusy("");
    }
  }
  const must = <T,>({ data, error }: { data: T; error: unknown }) => { if (error) throw error; return data; };

  if (account === null) return <p style={s("margin:0;font-size:14px;color:#7A8293")}>Checking whether you’re signed in…</p>;
  if (account === "signed-out" || account === "needs-mfa") {
    return (
      <p style={s("margin:0;font-size:15px;color:#4B5568")}>
        {account === "signed-out"
          ? <><Link href="/login">Sign in</Link> to download or delete your data here. </>
          : <>Finish the <Link href="/mfa">authenticator step</Link> first: your data can only be read or deleted from a session that has passed both sign-in steps. </>}
      </p>
    );
  }
  const { id } = account;

  const download = () => run("download", async () => {
    const [profile, conversations, saved] = await Promise.all([
      supabase.from("profiles").select("*").maybeSingle().then(must),
      // ponytail: one request; Supabase caps a response (1,000 rows by default), so very long histories would need paging.
      supabase.from("conversations").select("id,title,created_at,updated_at,messages(role,content,sources,limitations,model,created_at)").order("created_at").then(must),
      supabase.from("saved_trials").select("nct_id,title,source_url,created_at").order("created_at").then(must),
    ]);
    const file = { exported_at: new Date().toISOString(), account: { id, email: account.email }, profile, conversations, saved_trials: saved,
      not_included: `Server access-log entries and anything held by outside services. Ask for these at ${EMAIL}.` };
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }));
    link.download = `orvant-my-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    return "Your file has downloaded. It contains health details, so store it somewhere safe.";
  });

  const remove = (what: "conversations" | "saved") => run(what, async () => {
    // Row-level security already limits deletes to this account; the filter is what Supabase needs to allow a bulk delete.
    // Deleting a conversation removes its messages too (on delete cascade).
    const rows = must(await supabase.from(what === "conversations" ? "conversations" : "saved_trials").delete().eq("user_id", id).select("user_id")) as unknown[];
    return what === "conversations" ? `Deleted ${rows.length} conversation${rows.length === 1 ? "" : "s"} and their messages.` : `Removed ${rows.length} saved trial${rows.length === 1 ? "" : "s"}.`;
  });

  const ask = (what: "conversations" | "saved") => { setConfirming(what); dialog.current?.showModal(); };
  const BUTTON = "font-size:14px;border-radius:999px;padding:10px 18px;display:flex;align-items:center;gap:8px";

  return (
    <div style={s("display:flex;flex-direction:column;gap:16px")}>
      <p style={s("margin:0;font-size:14px;color:#4B5568")}>Signed in as <span style={s("color:#142237")}>{account.email}</span>.</p>
      <div style={s("display:flex;gap:10px;flex-wrap:wrap")}>
        <button type="button" className="btn-ink" disabled={Boolean(busy)} onClick={download} style={s(`${BUTTON};border:0;background:#142237;color:#F7F6F2`)}>
          <Icon d={ICON.export} size={15} />{busy === "download" ? "Preparing…" : "Download my data (JSON)"}
        </button>
        <Link href="/profile" className="btn-line" style={s(`${BUTTON};border:1px solid #D6D2C6;background:#FFFFFF;color:#142237`)}>Correct my profile</Link>
      </div>
      <div style={s("display:flex;gap:10px;flex-wrap:wrap;border-top:1px solid #EEECE5;padding-top:16px")}>
        <button type="button" className="btn-line" disabled={Boolean(busy)} onClick={() => ask("conversations")} style={s(`${BUTTON};border:1px solid #D6D2C6;background:#FFFFFF;color:#C8442F`)}>
          <Icon d={ICON.trash} size={15} />{busy === "conversations" ? "Deleting…" : "Delete all Ask conversations"}
        </button>
        <button type="button" className="btn-line" disabled={Boolean(busy)} onClick={() => ask("saved")} style={s(`${BUTTON};border:1px solid #D6D2C6;background:#FFFFFF;color:#C8442F`)}>
          <Icon d={ICON.trash} size={15} />{busy === "saved" ? "Removing…" : "Remove all saved trials"}
        </button>
      </div>
      <div role="status" aria-live="polite">{result && <p style={s(`margin:0;font-size:14px;color:${result.ok ? "#1F8A5B" : "#C8442F"}`)}>{result.text}</p>}</div>

      <dialog ref={dialog} className="wb-dialog" aria-labelledby="pv-confirm-title" onClose={() => setConfirming(null)}>
        <form method="dialog" style={s("display:flex;flex-direction:column;gap:16px")}>
          <h2 id="pv-confirm-title" style={s("margin:0;font-weight:400;font-size:22px;letter-spacing:-.01em")}>
            {confirming === "saved" ? "Remove every saved trial?" : "Delete every Ask conversation?"}
          </h2>
          <p style={s("margin:0;font-size:14px;color:#4B5568")}>
            {confirming === "saved" ? "Your bookmarks are removed from your account." : "Every conversation and all of its messages are removed from your account."} This can’t be
            undone in the app. Copies an AI provider already received are not affected.
          </p>
          <div style={s("display:flex;justify-content:flex-end;gap:8px;margin-top:4px")}>
            <button value="cancel" autoFocus className="btn-line" style={s("font-size:14px;border:1px solid #D6D2C6;border-radius:999px;padding:10px 18px;background:#FFFFFF;color:#142237")}>Cancel</button>
            <button value="confirm" onClick={() => confirming && remove(confirming)} className="btn-ink" style={s("font-size:14px;border:0;border-radius:999px;padding:10px 18px;background:#C8442F;color:#FFFFFF")}>
              {confirming === "saved" ? "Remove all" : "Delete all"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
