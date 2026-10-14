"use client";

// Ask: questions answered from the trial index, with numbered sources and inline citations. Conversations are saved per account.
// PubMed abstracts (on request) and ICD-10-CM codes (for coding questions) are shown apart from the trial sources;
// RxNorm generic names added to the search for a brand named as prior therapy are listed above them.
import { Fragment, useEffect, useRef, useState } from "react";

import { type Article, api, ApiError, type ChatTurn, type Code, type Provider, type Source } from "@/lib/api";
import { A } from "@/lib/assets";
import { s } from "@/lib/s";
import { tidy } from "@/lib/tidy";
import { addMessages, type Conversation, deleteConversation, listConversations, loadMessages, type Message, startConversation } from "@/lib/saved";

import { useWorkbench } from "./context";
import { CARD, FlipText, human, ICON, Icon, MONO, Notice, PHASE_LABEL } from "./ui";

const SUGGESTIONS = [
  "Which trials are recruiting for HER2-positive breast cancer?",
  "Are there trials for EGFR-mutant lung cancer after osimertinib?",
  "Which leukemia trials use CAR-T cells?",
];
const STEPS = ["Searching the trial index", "Reading the registry text", "Checking what each trial asks for", "Matching quotes to their sources", "Writing an answer with citations"];
// The API takes 20 turns; older ones add little to a follow-up.
const HISTORY_TURNS = 10;
// Bracketed citations, [PMID:…] and [ICD:…] tags, **bold**, or a bare NCT ID (smaller models often write those instead of citing).
const CITE = /(\[NCT\d{8}(?:\s*[,;]\s*NCT\d{8})*\]|\[PMID:\s*\d+\]|\[ICD:\s*[^\]\s]+\]|\*\*[^*]+\*\*|NCT\d{8})/g;
const NLM = "Uses publicly available data from the U.S. National Library of Medicine (NLM), which does not endorse this product.";
// model is shown until /api/stats reports what the server actually runs.
const MODELS: { id: Provider; label: string; logo: string; model: string }[] = [
  { id: "gemini", label: "Gemini", logo: A["logo-gemini.svg"], model: "gemini-3.8-flash" },
  { id: "groq", label: "Groq", logo: A["logo-groq.svg"], model: "openai/gpt-oss-120b" },
  { id: "huggingface", label: "Hugging Face", logo: A["logo-huggingface.svg"], model: "meta-llama/Llama-3.1-8B-Instruct" },
  { id: "openrouter", label: "OpenRouter", logo: A["logo-openrouter.svg"], model: "meta-llama/llama-3.1-8b-instruct" },
];

const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function ChatPanel() {
  const { firstName, stats, signOut: onAuthLost, chatId: active, setChatId: setActive, askDraft, setAskDraft } = useWorkbench();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Last model picked, remembered on this device.
  const [provider, setProvider] = useState<Provider>("gemini");
  useEffect(() => { const saved = localStorage.getItem("chat-model"); if (MODELS.some((m) => m.id === saved)) setProvider(saved as Provider); }, []);
  const pick = (next: Provider) => { setProvider(next); localStorage.setItem("chat-model", next); };
  // PubMed is opt-in and remembered on this device: it sends the question's topic words to NCBI.
  const [literature, setLiterature] = useState(false);
  useEffect(() => { setLiterature(localStorage.getItem("chat-literature") === "1"); }, []);
  const toggleLiterature = () => setLiterature((on) => { localStorage.setItem("chat-literature", on ? "0" : "1"); return !on; });
  const models = stats?.chat_models ?? null;
  const history = useRef<HTMLDialogElement>(null);
  const turn = useRef<HTMLDivElement>(null);

  const fail = (caught: unknown) => {
    if (caught instanceof ApiError && caught.status === 401) return onAuthLost();
    setError(caught instanceof Error ? caught.message : String((caught as { message?: string })?.message ?? caught));
  };
  const refresh = () => listConversations().then(setConversations, fail);
  // A question from a trial card starts a new chat with it in the box, unsent; otherwise the last conversation reopens.
  useEffect(() => {
    refresh();
    if (askDraft) { newChat(); setDraft(askDraft); setAskDraft(null); }
    else if (active) open(active);
  }, []);
  // A new question rises to the top of the view, with room below for its answer.
  useEffect(() => { if (pending) turn.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [pending]);

  function newChat() {
    setActive(null); setMessages([]); setError(""); setDraft("");
  }

  async function open(id: string) {
    history.current?.close();
    setActive(id); setMessages([]); setError(""); setLoading(true);
    try { setMessages(await loadMessages(id)); } catch (caught) { fail(caught); } finally { setLoading(false); }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this conversation? This can't be undone.")) return;
    try {
      await deleteConversation(id);
      setConversations((list) => list.filter((c) => c.id !== id));
      if (id === active) newChat();
    } catch (caught) { fail(caught); }
  }

  async function ask(text: string) {
    const question = text.trim();
    if (!question || pending) return;
    setPending(question); setDraft(""); setError("");
    const asked: Message = { role: "user", content: question, sources: [], articles: [], codes: [], drugs: [], limitations: [], model: null };
    const turns: ChatTurn[] = [...messages, asked].slice(-HISTORY_TURNS).map(({ role, content }) => ({ role, content }));
    let reply: Message;
    try {
      const response = await api.chat(turns, provider, literature);
      reply = { role: "assistant", content: response.answer, sources: response.sources, articles: response.articles, codes: response.codes, drugs: response.drugs, limitations: response.limitations, model: response.model };
    } catch (caught) {
      // Nothing is saved for a failed answer; the question goes back in the box to retry.
      setDraft(question); setPending("");
      return fail(caught);
    }
    setMessages((list) => [...list, asked, reply]);
    setPending("");
    try {
      const id = active ?? (await startConversation(question)).id;
      setActive(id);
      await addMessages(id, [asked, reply]);
      refresh();
    } catch (caught) {
      setError(`The answer is shown but couldn't be saved: ${caught instanceof Error ? caught.message : (caught as { message?: string })?.message}`);
    }
  }

  const empty = !messages.length && !pending && !loading;
  // The latest exchange: from the last question on (or the one being answered).
  const latest = pending ? messages.length : Math.max(0, messages.map((m) => m.role).lastIndexOf("user"));
  const render = (message: Message, i: number) => message.role === "user" ? <Question key={i} text={message.content} /> : <Reply key={i} message={message} />;
  return (
    <div style={s("display:flex;flex-direction:column;gap:20px;min-height:calc(100vh - 164px)")}>
      <div style={s("display:flex;align-items:center;gap:8px;flex-wrap:wrap")}>
        <h1 style={s("margin:0 auto 0 0;font-weight:400;font-size:28px;letter-spacing:-.02em")}>Ask about trials</h1>
        {!empty && (
          <button type="button" className="chip" onClick={newChat} style={s("font-size:13px;padding:7px 12px;border-radius:999px;border:1px solid #D6D2C6;background:#FFFFFF;display:flex;align-items:center;gap:6px")}>
            <Icon d={ICON.plus} size={14} />New chat
          </button>
        )}
        <button type="button" className="chip" onClick={() => history.current?.showModal()} disabled={!conversations.length}
          style={s(`font-size:13px;padding:7px 12px;border-radius:999px;border:1px solid #D6D2C6;background:#FFFFFF;display:flex;align-items:center;gap:6px;opacity:${conversations.length ? 1 : 0.5}`)}>
          <Icon d={ICON.history} size={14} />History
        </button>
      </div>

      <dialog ref={history} className="wb-dialog" aria-labelledby="history-title" style={s("width:min(520px, calc(100vw - 32px))")}>
        <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:12px")}>
          <h2 id="history-title" style={s("margin:0;font-weight:400;font-size:22px")}>Your conversations</h2>
          <button type="button" onClick={() => history.current?.close()} aria-label="Close" style={s("border:0;background:none;font-size:22px;color:#7A8293")}>×</button>
        </div>
        <ConversationList conversations={conversations} active={active} onOpen={open} onDelete={remove} />
      </dialog>

      {empty ? (
        <div className="wb-in" style={s("flex:1;display:flex;flex-direction:column;justify-content:center;gap:22px;padding:24px 0")}>
          <div style={s("display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px")}>
            <div style={s("position:relative;width:64px;height:64px")}>
              <div style={s("position:absolute;inset:0;border-radius:50%;border:2px solid #E3E9FF;border-top-color:#0045FD")} />
              <div style={s("position:absolute;inset:16px;border-radius:50%;background:radial-gradient(circle,#6E8DFF,#0045FD)")} />
            </div>
            <div style={s("font-size:26px;letter-spacing:-.02em")}>{firstName ? `What would you like to know, ${firstName}?` : "What would you like to know?"}</div>
            <p style={s("margin:0;max-width:520px;font-size:14.5px;color:#4B5568")}>
              Answers come only from {stats ? `${stats.trials.toLocaleString("en-US")} ` : ""}recruiting cancer trials on ClinicalTrials.gov, with numbered sources you can check.
              Turn on PubMed to add published research, kept separate from the trial facts.
            </p>
          </div>
          <Composer value={draft} onChange={setDraft} onSend={ask} busy={Boolean(pending)} autoFocus picker={<><ModelPicker value={provider} models={models} onChange={pick} /><LiteratureToggle on={literature} onToggle={toggleLiterature} /></>} />
          <div style={s("display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:10px")}>
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" className="chip" onClick={() => ask(suggestion)}
                style={s("text-align:left;font-size:14px;padding:14px 16px;border-radius:16px;border:1px solid #E3E0D7;background:#FFFFFF;color:#142237;display:flex;gap:10px;align-items:flex-start")}>
                <span style={s("margin-top:2px;color:#0045FD;display:flex")}><Icon d={ICON.chat} size={16} /></span>{suggestion}
              </button>
            ))}
          </div>
          {error && <Notice tone="red">{error}</Notice>}
          {conversations.length > 0 && (
            <div style={s("display:flex;flex-direction:column;gap:8px;margin-top:8px")}>
              <div style={s("font-size:13px;color:#7A8293")}>Recent conversations</div>
              <ConversationList conversations={conversations.slice(0, 5)} active={active} onOpen={open} onDelete={remove} />
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={s("flex:1;display:flex;flex-direction:column;gap:28px")}>
            {loading && <div className="wb-skeleton" style={s("height:120px;border-radius:20px")} />}
            {messages.slice(0, latest).map(render)}
            <div ref={turn} style={s("display:flex;flex-direction:column;gap:28px;scroll-margin-top:24px;min-height:calc(100vh - 260px)")}>
              {messages.slice(latest).map((message, i) => render(message, latest + i))}
              {pending && <><Question text={pending} /><Working /></>}
              {error && <Notice tone="red">{error}</Notice>}
            </div>
          </div>
          <div style={s("position:sticky;bottom:16px;z-index:5")}>
            <Composer value={draft} onChange={setDraft} onSend={ask} busy={Boolean(pending)} placeholder="Ask a follow-up…" picker={<><ModelPicker value={provider} models={models} onChange={pick} /><LiteratureToggle on={literature} onToggle={toggleLiterature} /></>} />
          </div>
        </>
      )}
    </div>
  );
}

function Composer({ value, onChange, onSend, busy, placeholder, autoFocus, picker }: { value: string; onChange: (value: string) => void; onSend: (text: string) => void; busy: boolean; placeholder?: string; autoFocus?: boolean; picker: React.ReactNode }) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSend(value); }}
      style={s("border-radius:22px;background:#FFFFFF;border:1px solid #E3E0D7;padding:12px 12px 12px 18px;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:flex-end;box-shadow:0 24px 48px -30px rgba(0,69,253,.55)")}>
      <textarea aria-label="Ask a question about clinical trials" value={value} onChange={(e) => onChange(e.target.value)} maxLength={2000} rows={2} autoFocus={autoFocus}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(value); } }}
        placeholder={placeholder ?? "Ask anything about the trials, e.g. which melanoma trials accept people who had immunotherapy?"}
        style={s("flex:1 1 100%;min-width:0;font-size:16px;line-height:1.5;border:0;background:transparent;outline:none;resize:none;padding:6px 0;font-family:inherit")} />
      {picker}
      <button className="btn-blue" disabled={busy || !value.trim()} aria-label="Send"
        style={s(`margin-left:auto;width:42px;height:42px;flex:none;border:0;border-radius:50%;background:#0045FD;color:#FFFFFF;display:flex;align-items:center;justify-content:center;opacity:${busy || !value.trim() ? 0.45 : 1}`)}>
        <span style={s("display:flex;transform:rotate(-90deg)")}><Icon d={ICON.arrow} size={18} /></span>
      </button>
    </form>
  );
}

/** Logo dropdown in the composer. Providers without a key on this deployment are listed but can't be picked. */
function ModelPicker({ value, models, onChange }: { value: Provider; models: Record<Provider, string | null> | null; onChange: (id: Provider) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => { if (event instanceof KeyboardEvent ? event.key === "Escape" : !box.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  const current = MODELS.find((m) => m.id === value)!;
  return (
    <div ref={box} style={s("position:relative")}>
      <button type="button" className="chip" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)} title={models?.[value] ?? current.model}
        style={s("font-size:13px;padding:7px 10px 7px 8px;border-radius:999px;border:1px solid #E3E0D7;background:#F7F6F2;color:#142237;display:flex;align-items:center;gap:7px")}>
        <img src={current.logo} alt="" width={18} height={18} style={s("display:block")} />{current.label}
        <span style={s("display:flex;transform:rotate(90deg);color:#7A8293")}><Icon d={ICON.chevron} size={12} /></span>
      </button>
      {open && (
        <ul role="listbox" aria-label="Answer model" className="wb-in"
          style={s("position:absolute;left:0;bottom:calc(100% + 8px);z-index:30;list-style:none;margin:0;padding:6px;width:290px;border-radius:16px;background:#FFFFFF;border:1px solid #E3E0D7;box-shadow:0 24px 48px -20px rgba(20,34,55,.35)")}>
          {MODELS.map((m) => {
            const model = models?.[m.id];
            const off = models != null && !model;
            return (
              <li key={m.id} role="option" aria-selected={m.id === value} aria-disabled={off}>
                <button type="button" disabled={off} onClick={() => { onChange(m.id); setOpen(false); }} className="model-opt"
                  style={s(`width:100%;border:0;border-radius:11px;padding:9px 10px;display:flex;align-items:center;gap:10px;text-align:left;background:${m.id === value ? "#E3E9FF" : "transparent"};opacity:${off ? 0.45 : 1}`)}>
                  <span style={s("width:30px;height:30px;border-radius:9px;background:#F7F6F2;display:flex;align-items:center;justify-content:center;flex:none")}><img src={m.logo} alt="" width={20} height={20} /></span>
                  <span style={s("min-width:0;flex:1;display:flex;flex-direction:column")}>
                    <span style={s("font-size:14px;color:#142237")}>{m.label}</span>
                    <span style={s(`${MONO};font-size:11px;color:#7A8293;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`)}>{off ? "Not set up on this server" : model ?? m.model}</span>
                  </span>
                  {m.id === value && <Icon d="M5 12.5l4.5 4.5L19 7.5" size={16} color="#0045FD" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LiteratureToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onToggle}
      title="Also search published research on PubMed. Only the question's topic words go to NCBI: no profile, age or place."
      style={s(`font-size:13px;padding:5px 4px;border:0;background:none;color:${on ? "#0036C8" : "#4B5568"};display:flex;align-items:center;gap:8px`)}>
      <span aria-hidden className="switch-track" style={s(`position:relative;width:32px;height:18px;border-radius:999px;flex:none;background:${on ? "#0045FD" : "#D6D2C6"}`)}>
        <span className="switch-thumb" style={s(`position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#FFFFFF;box-shadow:0 1px 2px rgba(20,34,55,.25);transform:translateX(${on ? 14 : 0}px)`)} />
      </span>
      PubMed
    </button>
  );
}

function ConversationList({ conversations, active, onOpen, onDelete }: { conversations: Conversation[]; active: string | null; onOpen: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <ul style={s("list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px")}>
      {conversations.map((c) => (
        <li key={c.id} style={s(`display:flex;align-items:center;gap:6px;border-radius:14px;border:1px solid ${c.id === active ? "#0045FD" : "#E3E0D7"};background:#FFFFFF`)}>
          <button type="button" onClick={() => onOpen(c.id)} style={s("flex:1;min-width:0;border:0;background:none;padding:11px 14px;display:flex;gap:10px;align-items:center;text-align:left")}>
            <span style={s("flex:1;min-width:0;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{c.title}</span>
            <span style={s("font-size:12px;color:#7A8293;flex:none")}>{when(c.updated_at)}</span>
          </button>
          <button type="button" onClick={() => onDelete(c.id)} aria-label={`Delete “${c.title}”`} title="Delete" style={s("border:0;background:none;padding:8px 12px 8px 4px;color:#9AA3B5;display:flex")}>
            <Icon d={ICON.trash} size={15} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function Question({ text }: { text: string }) {
  return (
    <div className="wb-in" style={s("align-self:flex-end;max-width:min(80%,600px);border-radius:20px 20px 6px 20px;background:#142237;color:#F7F6F2;padding:12px 16px;font-size:15px;white-space:pre-wrap;overflow-wrap:anywhere")}>
      {text}
    </div>
  );
}

function Working() {
  return (
    <div role="status" aria-live="polite" style={s("display:flex;flex-direction:column;gap:14px")}>
      <div style={s("display:flex;align-items:center;gap:10px;font-size:15px;color:#4B5568")}>
        <div className="wb-orbit" style={s("width:20px;height:20px;border-radius:50%;border:2px solid #E3E9FF;border-top-color:#0045FD;flex:none")} />
        <FlipText lines={STEPS} />
      </div>
      <div style={s("display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px")} aria-hidden>
        {[0, 1, 2].map((n) => <div key={n} className="wb-skeleton" style={s("height:84px;border-radius:14px")} />)}
      </div>
      <div className="wb-skeleton" style={s("height:16px;width:90%")} />
      <div className="wb-skeleton" style={s("height:16px;width:70%")} />
    </div>
  );
}

/** Sources first, as numbered cards; the answer below cites them by number. Hovering either side highlights the pair. */
function Reply({ message }: { message: Message }) {
  const [focus, setFocus] = useState<string | null>(null);
  const number = new Map(message.sources.map((source, i) => [source.nct_id, i + 1]));
  const cited = new Set(message.content.match(/NCT\d{8}|PMID:\s*\d+/g)?.map((id) => id.replace(/\s/g, "")));
  const articles = message.articles ?? [];
  const codes = message.codes ?? [];
  const drugs = message.drugs ?? [];
  const model = MODELS.find((m) => m.id === message.model?.split(":")[0]);
  return (
    <article className="wb-in" style={s("display:flex;flex-direction:column;gap:16px")}>
      {drugs.length > 0 && (
        <div style={s("font-size:13px;color:#4B5568")}>
          Also searched for {drugs.map((d, i) => <Fragment key={d.name}>{i > 0 && "; "}<strong style={s("font-weight:500")}>{d.generics.join(", ")}</strong> ({d.name})</Fragment>)} · names from RxNorm
        </div>
      )}
      {message.sources.length > 0 && (
        <section aria-label="Sources" style={s("display:flex;flex-direction:column;gap:8px")}>
          <div style={s("display:flex;align-items:center;gap:6px;font-size:13px;color:#4B5568")}><Icon d={ICON.source} size={14} />Sources</div>
          <div className="src-row">
            {message.sources.map((source, i) => (
              <SourceCard key={source.nct_id} source={source} n={i + 1} cited={cited.has(source.nct_id)} on={focus === source.nct_id} onFocus={setFocus} />
            ))}
          </div>
        </section>
      )}
      {articles.length > 0 && (
        <section aria-label="Published research" style={s("display:flex;flex-direction:column;gap:8px")}>
          <div style={s("display:flex;align-items:center;gap:6px;font-size:13px;color:#4B5568")}><Icon d={ICON.answer} size={14} />Published research · PubMed, not registry data</div>
          <div className="src-row">
            {articles.map((article, i) => <ArticleCard key={article.pmid} article={article} n={i + 1} cited={cited.has(`PMID:${article.pmid}`)} on={focus === `PMID:${article.pmid}`} onFocus={setFocus} />)}
          </div>
        </section>
      )}
      {codes.length > 0 && (
        <section aria-label="Diagnosis codes" style={s("display:flex;flex-direction:column;gap:8px")}>
          <div style={s("display:flex;align-items:center;gap:6px;font-size:13px;color:#4B5568")}><Icon d={ICON.data} size={14} />ICD-10-CM codes · NLM Clinical Tables</div>
          <ul style={s("list-style:none;margin:0;padding:12px 14px;border-radius:14px;background:#FFFFFF;border:1px solid #E3E0D7;display:flex;flex-direction:column;gap:6px;font-size:13px")}>
            {codes.map((c) => <li key={c.code} style={s("display:flex;gap:10px")}><span style={s(`${MONO};color:#0036C8;min-width:64px`)}>{c.code}</span>{c.name}</li>)}
          </ul>
        </section>
      )}
      <div style={s(CARD + ";gap:10px;font-size:15.5px;line-height:1.65")}>
        <Answer text={message.content} number={number} sources={message.sources} articles={articles} codes={codes} focus={focus} onFocus={setFocus} />
        {message.limitations.length > 0 && (
          <details className="more" style={s("font-size:13px;color:#7A8293;margin-top:4px")}>
            <summary><Icon d={ICON.chevron} size={13} />What this answer doesn't cover</summary>
            <ul style={s("margin:6px 0 0;padding-left:18px")}>{message.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>
          </details>
        )}
        <div style={s("font-size:12px;color:#7A8293;border-top:1px solid #EEECE5;padding-top:10px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center")}>
          {model && <span style={s("display:flex;align-items:center;gap:6px")}><img src={model.logo} alt="" width={14} height={14} />Answered by {model.label}<span style={s(MONO)}>{message.model!.split(":").slice(1).join(":")}</span></span>}
          <span>Not medical advice or an eligibility decision. Check each trial with your care team.</span>
          {(articles.length > 0 || codes.length > 0 || drugs.length > 0) && <span>{NLM}</span>}
        </div>
      </div>
    </article>
  );
}

function SourceCard({ source, n, cited, on, onFocus }: { source: Source; n: number; cited: boolean; on: boolean; onFocus: (id: string | null) => void }) {
  return (
    <a href={source.source_url} target="_blank" rel="noreferrer" className="src" data-on={on || undefined} data-cited={cited || undefined}
      onMouseEnter={() => onFocus(source.nct_id)} onMouseLeave={() => onFocus(null)} onFocus={() => onFocus(source.nct_id)} onBlur={() => onFocus(null)}
      title={source.quotes[0] ? `“${source.quotes[0]}”` : source.title}>
      <span style={s("display:flex;align-items:center;gap:6px;font-size:11.5px;color:#7A8293")}>
        <span className="src-n">{n}</span><span style={s(MONO)}>{source.nct_id}</span>
      </span>
      <span style={s("font-size:13px;line-height:1.35;color:#142237;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden")}>{source.title}</span>
      <span style={s("font-size:11.5px;color:#7A8293;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>
        {[human(source.overall_status), ...source.phases.map((p) => PHASE_LABEL[p] ?? human(p))].join(" · ")}
      </span>
    </a>
  );
}

function ArticleCard({ article, n, cited, on, onFocus }: { article: Article; n: number; cited: boolean; on: boolean; onFocus: (id: string | null) => void }) {
  const id = `PMID:${article.pmid}`;
  return (
    <a href={article.url} target="_blank" rel="noreferrer" className="src" data-on={on || undefined} data-cited={cited || undefined}
      onMouseEnter={() => onFocus(id)} onMouseLeave={() => onFocus(null)} onFocus={() => onFocus(id)} onBlur={() => onFocus(null)}
      title={article.quotes[0] ? `“${article.quotes[0]}”` : article.title}>
      <span style={s("display:flex;align-items:center;gap:6px;font-size:11.5px;color:#7A8293")}>
        <span className="src-n" style={s("background:#F6EBD3;color:#7A500A")}>P{n}</span><span style={s(MONO)}>PMID {article.pmid}</span>
      </span>
      <span style={s("font-size:13px;line-height:1.35;color:#142237;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden")}>{article.title}</span>
      <span style={s("font-size:11.5px;color:#7A8293;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{[article.journal, article.year].filter(Boolean).join(" · ")}</span>
    </a>
  );
}

// Longer answers show their opening and fold the rest behind "Show full answer".
const FOLD_AFTER = 900;
const SHOWN_WHEN_FOLDED = 550;

/** The model's text, tidied (lib/tidy.ts), with **bold** and [NCT…] citations turned into numbered chips. */
function Answer({ text, number, sources, articles, codes, focus, onFocus }: { text: string; number: Map<string, number>; sources: Source[]; articles: Article[]; codes: Code[]; focus: string | null; onFocus: (id: string | null) => void }) {
  const inline = (line: string): React.ReactNode[] => line.split(CITE).map((part, i) => {
    if (part.startsWith("**")) return <strong key={i} style={s("font-weight:500")}>{inline(part.slice(2, -2))}</strong>;
    if (part.startsWith("[PMID:")) {
      const pmid = part.slice(6, -1).trim();
      const n = articles.findIndex((a) => a.pmid === pmid);
      // A PMID the check could not tie to a retrieved article stays as plain text.
      if (n < 0) return <span key={i} style={s(`${MONO};font-size:12px;color:#7A8293`)}> PMID {pmid}</span>;
      const id = `PMID:${pmid}`;
      return <a key={i} href={articles[n].url} target="_blank" rel="noreferrer" className="cite" data-on={focus === id || undefined} style={s("background:#F6EBD3;color:#7A500A")}
        onMouseEnter={() => onFocus(id)} onMouseLeave={() => onFocus(null)} onFocus={() => onFocus(id)} onBlur={() => onFocus(null)}
        title={articles[n].title} aria-label={`Article P${n + 1}: ${articles[n].title}`}>P{n + 1}</a>;
    }
    if (part.startsWith("[ICD:")) {
      const code = part.slice(5, -1).trim();
      const entry = codes.find((c) => c.code === code);
      return <span key={i} title={entry?.name ?? "Not returned by the ICD-10-CM lookup"} style={s(`${MONO};font-size:12.5px;color:${entry ? "#0036C8" : "#7A8293"}`)}>{code}</span>;
    }
    // A bare ID that is one of the sources becomes a link that lights up its card, without a number chip.
    if (/^NCT\d{8}$/.test(part) && number.has(part)) {
      return <a key={i} href={sources[number.get(part)! - 1].source_url} target="_blank" rel="noreferrer" className="cite-id" data-on={focus === part || undefined}
        onMouseEnter={() => onFocus(part)} onMouseLeave={() => onFocus(null)} onFocus={() => onFocus(part)} onBlur={() => onFocus(null)}>{part}</a>;
    }
    if (!part.startsWith("[NCT")) return <Fragment key={i}>{part}</Fragment>;
    return <Fragment key={i}>{part.match(/NCT\d{8}/g)!.map((id) => {
      const n = number.get(id);
      const source = sources[(n ?? 0) - 1];
      // A citation the evidence check could not tie to a source stays as plain text.
      if (!n) return <span key={id} style={s(`${MONO};font-size:12px;color:#7A8293`)}> {id}</span>;
      return (
        <a key={id} href={source.source_url} target="_blank" rel="noreferrer" className="cite" data-on={focus === id || undefined}
          onMouseEnter={() => onFocus(id)} onMouseLeave={() => onFocus(null)} onFocus={() => onFocus(id)} onBlur={() => onFocus(null)}
          title={`${source.title}${source.quotes[0] ? `\n“${source.quotes[0]}”` : ""}`} aria-label={`Source ${n}: ${source.title}`}>{n}</a>
      );
    })}</Fragment>;
  });
  const [full, setFull] = useState(false);
  const blocks = tidy(text);
  // Fold at a block boundary, keeping blocks until about SHOWN_WHEN_FOLDED characters.
  let shown = blocks.length;
  if (!full && text.length > FOLD_AFTER) {
    let size = 0;
    shown = Math.max(1, blocks.findIndex((block) => (size += block.lines.join(" ").length) > SHOWN_WHEN_FOLDED) + 1 || blocks.length);
  }
  return (
    <>
      {blocks.slice(0, shown).map((block, b) => block.kind === "ul"
        ? <ul key={b} style={s("margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px")}>{block.lines.map((line, i) => <li key={i}>{inline(line)}</li>)}</ul>
        : <p key={b} style={s("margin:0")}>{block.lines.map((line, i) => <Fragment key={i}>{i > 0 && <br />}{inline(line)}</Fragment>)}</p>)}
      {shown < blocks.length && (
        <button type="button" onClick={() => setFull(true)} style={s("align-self:flex-start;border:0;background:none;padding:0;color:#0045FD;font-size:14px;display:flex;align-items:center;gap:4px")}>
          Show full answer<span style={s("display:flex;transform:rotate(90deg)")}><Icon d={ICON.chevron} size={13} /></span>
        </button>
      )}
    </>
  );
}
