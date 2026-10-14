"use client";

import type { Session } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { SearchRun } from "@/components/workbench/Advanced";
import { type Workbench, WorkbenchContext } from "@/components/workbench/context";
import { Loader } from "@/components/Loader";
import { Sidebar } from "@/components/workbench/Sidebar";
import { EmptyState, MONO } from "@/components/workbench/ui";
import { api, ApiError, type MatchResponse, type SearchRequest, type Stats } from "@/lib/api";
import { A } from "@/lib/assets";
import { addFingerprint, hasFingerprintSensor, hasPasskey } from "@/lib/passkey";
import { hasSecondFactor, loadProfile, type Profile, profileSearch } from "@/lib/profile";
import { s } from "@/lib/s";
import { listSavedTrials, type SavedTrial, saveTrial, unsaveTrial } from "@/lib/saved";
import { supabase } from "@/lib/supabase";

const BROKEN_LEDGER = Array.from({ length: 30 }, (_, i) => { const h = (i * 53 + 7) % 31; return h < 4 ? "#C8442F" : h < 16 ? "#EEECE5" : "#E3E0D7"; });

export default function WorkbenchLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [session, setSession] = useState<Session | null>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [down, setDown] = useState<ApiError | null>(null);
  const [run, setRun] = useState<SearchRun | null>(null);
  const [preset, setPreset] = useState<Workbench["preset"]>({ key: 0 });
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState<SavedTrial[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchResponse | null>(null);
  // Offer fingerprint sign-in once per device when it has a sensor and the account has no passkey yet.
  const [offerFingerprint, setOfferFingerprint] = useState(false);
  const [fingerprintNote, setFingerprintNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);
  // Nothing loads until the session has passed the authenticator step; the tables enforce the same rule.
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    (async () => {
      if (!(await hasSecondFactor())) return router.replace("/mfa");
      setProfile(await loadProfile());
      setSaved(await listSavedTrials());
      if (!localStorage.getItem(`fingerprint-offer-dismissed:${userId}`) && (await hasFingerprintSensor()) && !(await hasPasskey())) setOfferFingerprint(true);
    })().catch((caught) => setError(caught instanceof Error ? caught.message : String(caught)));
  }, [userId, router]);
  // One call: /api/stats carries everything /health does (freshness, build status), so the workbench skips /health.
  useEffect(() => {
    api.stats().then(setStats, (caught) => setDown(caught instanceof ApiError ? caught : new ApiError(0, String(caught))));
  }, []);
  useEffect(() => { setCollapsed(localStorage.getItem("sidebar-collapsed") === "1"); }, []);
  const toggleSidebar = () => setCollapsed((was) => { localStorage.setItem("sidebar-collapsed", was ? "0" : "1"); return !was; });

  const signOut = useCallback(() => { supabase.auth.signOut(); }, []);

  async function setUpFingerprint() {
    const failure = await addFingerprint();
    setFingerprintNote(failure ? { ok: false, text: failure } : { ok: true, text: "Done. Next time, choose “Sign in with fingerprint or passkey”." });
    if (!failure) setOfferFingerprint(false);
  }
  const dismissFingerprint = () => { localStorage.setItem(`fingerprint-offer-dismissed:${userId}`, "1"); setOfferFingerprint(false); };

  async function search(request: SearchRequest) {
    setPending(request.query);
    setError("");
    const started = performance.now();
    try {
      const response = await api.search(request);
      setRun({ request, response, ms: Math.round(performance.now() - started) });
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) return signOut();
      // Errors are shown as they are; stale results are cleared rather than passed off as the answer.
      setRun(null);
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setPending("");
    }
  }

  // Optimistic: the bookmark flips at once and flips back if the database refuses.
  const toggleSave: Workbench["toggleSave"] = async (trial) => {
    const before = saved;
    const was = saved.some((t) => t.nct_id === trial.nct_id);
    setSaved(was ? saved.filter((t) => t.nct_id !== trial.nct_id) : [{ ...trial, created_at: new Date().toISOString() }, ...saved]);
    try {
      if (was) await unsaveTrial(trial.nct_id);
      else await saveTrial(trial);
    } catch (caught) {
      setSaved(before);
      window.alert(`Couldn't ${was ? "remove" : "save"} that trial: ${(caught as { message?: string })?.message ?? caught}`);
    }
  };

  // The loader stays until the session, second factor and profile are in; an error replaces it.
  if (!session || !profile) return error ? <main style={s("min-height:100vh;display:flex;align-items:center;justify-content:center;color:#C8442F")}>{error}</main> : <Loader label="Checking your session" />;

  const firstName = profile.full_name.split(" ")[0];
  const value: Workbench = {
    session, profile, firstName, stats, saved, savedIds: new Set(saved.map((t) => t.nct_id)), toggleSave, run, pending, error, search, preset,
    findForProfile: () => {
      const request = profileSearch(profile);
      setPreset(({ key }) => ({ key: key + 1, request }));
      router.push("/workbench/search");
      search(request);
    },
    match, setMatch, chatId, setChatId, signOut,
  };
  // Ask lays out its own full-height column; every other page uses the reading width.
  const wide = path.startsWith("/workbench/ask");

  return (
    <WorkbenchContext.Provider value={value}>
      <div className="wb" data-collapsed={collapsed || undefined}>
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} hasResults={Boolean(match)} name={profile.full_name} email={session.user.email ?? ""} onSignOut={signOut} />
        <main style={s("position:relative;min-width:0;overflow-x:clip")}>
          <div style={s("position:absolute;width:800px;height:800px;right:-300px;top:-380px;border-radius:50%;background:radial-gradient(circle,rgba(244,170,120,.4),rgba(244,170,120,0) 60%);pointer-events:none")} />
          <div style={s(`position:absolute;inset:0;background-image:url(${A["grain.svg"]});opacity:.25;mix-blend-mode:multiply;pointer-events:none`)} />

          <div style={s(`position:relative;max-width:920px;margin:0 auto;padding:44px 24px ${wide ? "24px" : "120px"}`)}>
            {(offerFingerprint || fingerprintNote) && !down && (
              <div className="wb-in" role="status" style={s(`margin-bottom:24px;border-radius:18px;padding:16px 18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:${fingerprintNote && !fingerprintNote.ok ? "#F8E2DC" : fingerprintNote ? "#E1F2E9" : "#142237"};color:${fingerprintNote && !fingerprintNote.ok ? "#C8442F" : fingerprintNote ? "#1F8A5B" : "#F7F6F2"}`)}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" style={{ flex: "none" }}><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4M14 13.12c0 2.38 0 6.38-1 8.88M17.29 21.02c.12-.6.43-2.3.5-3.02M2 12a10 10 0 0 1 18-6M2 16h.01M21.8 16c.2-2 .131-5.354 0-6M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2M8.65 22c.21-.66.45-1.32.57-2M9 6.8a6 6 0 0 1 9 5.2v2" /></svg>
                <div style={s("flex:1;min-width:220px")}>
                  {fingerprintNote ? <div style={s("font-size:14px")}>{fingerprintNote.text}</div> : (
                    <>
                      <div style={s("font-size:15px")}>Sign in with your fingerprint next time</div>
                      <div style={s("font-size:13px;color:#B5BDCC")}>Skip the email code: your fingerprint or face unlock replaces it.</div>
                    </>
                  )}
                </div>
                {offerFingerprint && (
                  <div style={s("display:flex;gap:8px")}>
                    <button type="button" className="btn-blue" onClick={setUpFingerprint} style={s("font-size:14px;border:0;border-radius:999px;padding:9px 16px;background:#0045FD;color:#FFFFFF")}>{fingerprintNote ? "Try again" : "Set up fingerprint"}</button>
                    <button type="button" onClick={dismissFingerprint} style={s(`font-size:14px;border:0;background:none;padding:9px 6px;color:${fingerprintNote ? "inherit" : "#B5BDCC"}`)}>Not now</button>
                  </div>
                )}
                {fingerprintNote?.ok && <button type="button" onClick={() => setFingerprintNote(null)} aria-label="Close" style={s("border:0;background:none;color:inherit;font-size:18px")}>×</button>}
              </div>
            )}
            {down ? (
              <div style={s("min-height:70vh;display:flex;align-items:center;justify-content:center")}>
                <div style={s("max-width:520px;width:100%")}>
                  <EmptyState title={down.status === 503 ? "Trial search is unavailable" : "We can't reach the trial service"}
                    art={<div style={s("display:grid;grid-template-columns:repeat(10,14px);gap:4px")}>{BROKEN_LEDGER.map((color, i) => <span key={i} style={s(`width:14px;height:14px;border-radius:2px;background:${color}`)} />)}</div>}>
                    <p style={s(`${MONO};margin:0 0 8px;font-size:12.5px`)}>{down.message}</p>
                    Please try again in a few minutes.
                  </EmptyState>
                </div>
              </div>
            ) : children}
          </div>
        </main>
      </div>
    </WorkbenchContext.Provider>
  );
}
