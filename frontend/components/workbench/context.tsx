"use client";

// State the workbench layout keeps across its routes: session, profile, index stats, saved trials and the last search.
import type { Session } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

import type { MatchResponse, SearchRequest, Stats } from "@/lib/api";
import type { Profile } from "@/lib/profile";
import type { SavedTrial } from "@/lib/saved";

import type { SearchRun } from "./Advanced";
import type { SaveProps } from "./Search";

export type Workbench = {
  session: Session;
  profile: Profile;
  firstName: string;
  stats: Stats | null;
  saved: SavedTrial[];
  savedIds: Set<string>;
  toggleSave: SaveProps["onToggleSave"];
  run: SearchRun | null;
  pending: string;
  error: string;
  search: (request: SearchRequest) => void;
  /** Seeds the Find trials box; a new key reloads it. */
  preset: { key: number; request?: SearchRequest };
  findForProfile: () => void;
  /** The last patient match, shown on /workbench/match/results until the next run or sign-out. */
  match: MatchResponse | null;
  setMatch: (match: MatchResponse | null) => void;
  /** A question waiting in Ask's composer (set by "Ask AI" on a trial card); Ask takes it once and clears it. */
  askDraft: string | null;
  setAskDraft: (text: string | null) => void;
  /** Conversation open in Ask, so leaving the page and coming back reopens it. */
  chatId: string | null;
  setChatId: (id: string | null) => void;
  signOut: () => void;
};

export const WorkbenchContext = createContext<Workbench | null>(null);

export function useWorkbench() {
  const value = useContext(WorkbenchContext);
  if (!value) throw new Error("useWorkbench must be used inside app/workbench/layout.tsx");
  return value;
}
