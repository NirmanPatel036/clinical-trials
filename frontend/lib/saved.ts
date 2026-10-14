// Per-account rows behind RLS (aal2 only): Ask conversations and bookmarked trials. See supabase/schema.sql.
import type { Article, Code, Drug, Hit, Source } from "./api";
import { supabase } from "./supabase";

export type Conversation = { id: string; title: string; updated_at: string };
export type Message = { role: "user" | "assistant"; content: string; sources: Source[]; articles: Article[]; codes: Code[]; drugs: Drug[]; limitations: string[]; model: string | null };
// Articles, codes and drug expansions ride in the messages.sources JSON array, tagged by kind, so the table needs no new columns.
type Stored = Omit<Message, "articles" | "codes" | "drugs" | "sources"> & { sources: (Source | (Article & { kind: "pubmed" }) | (Code & { kind: "icd10cm" }) | (Drug & { kind: "rxnorm" }))[] };
const unpack = (row: Stored): Message => ({
  ...row,
  sources: row.sources.filter((x): x is Source => !("kind" in x)),
  articles: row.sources.filter((x): x is Article & { kind: "pubmed" } => "kind" in x && x.kind === "pubmed"),
  codes: row.sources.filter((x): x is Code & { kind: "icd10cm" } => "kind" in x && x.kind === "icd10cm"),
  drugs: row.sources.filter((x): x is Drug & { kind: "rxnorm" } => "kind" in x && x.kind === "rxnorm"),
});
const pack = ({ articles, codes, drugs, ...m }: Message): Stored => ({
  ...m, sources: [...m.sources, ...articles.map((a) => ({ ...a, kind: "pubmed" as const })), ...codes.map((c) => ({ ...c, kind: "icd10cm" as const })),
    ...drugs.map((d) => ({ ...d, kind: "rxnorm" as const }))],
});
export type SavedTrial = { nct_id: string; title: string; source_url: string; created_at: string };

const must = <T,>({ data, error }: { data: T; error: unknown }) => { if (error) throw error; return data; };

export const listConversations = async () =>
  must(await supabase.from("conversations").select("id,title,updated_at").order("updated_at", { ascending: false }).limit(50)) as Conversation[];

export const loadMessages = async (conversationId: string) =>
  (must(await supabase.from("messages").select("role,content,sources,limitations,model").eq("conversation_id", conversationId).order("id")) as Stored[]).map(unpack);

export const startConversation = async (question: string) =>
  must(await supabase.from("conversations").insert({ title: question.trim().slice(0, 120) }).select("id,title,updated_at").single()) as Conversation;

export async function addMessages(conversationId: string, messages: Message[]) {
  must(await supabase.from("messages").insert(messages.map((m) => ({ conversation_id: conversationId, ...pack(m) }))));
}

export async function deleteConversation(id: string) {
  must(await supabase.from("conversations").delete().eq("id", id));
}

export const listSavedTrials = async () =>
  must(await supabase.from("saved_trials").select("nct_id,title,source_url,created_at").order("created_at", { ascending: false })) as SavedTrial[];

/** Saving twice (say, from another tab) is not an error: 23505 means it is already saved. */
export async function saveTrial(trial: Pick<Hit, "nct_id" | "title" | "source_url">): Promise<SavedTrial> {
  const row = { nct_id: trial.nct_id, title: trial.title, source_url: trial.source_url };
  const { error } = await supabase.from("saved_trials").insert(row);
  if (error && error.code !== "23505") throw error;
  return { ...row, created_at: new Date().toISOString() };
}

export async function unsaveTrial(nctId: string) {
  must(await supabase.from("saved_trials").delete().eq("nct_id", nctId));
}
