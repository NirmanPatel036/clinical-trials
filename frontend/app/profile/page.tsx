"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Loader } from "@/components/Loader";
import { ProfileFields } from "@/components/ProfileFields";
import { A } from "@/lib/assets";
import { EMPTY, hasSecondFactor, loadProfile, saveProfile } from "@/lib/profile";
import { s } from "@/lib/s";
import { addFingerprint } from "@/lib/passkey";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(EMPTY);
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.replace("/login");
      if (!(await hasSecondFactor())) return router.replace("/mfa");
      setProfile(await loadProfile());
      setUserId(data.session.user.id);
    })().catch((caught) => setMessage({ ok: false, text: caught instanceof Error ? caught.message : String(caught) }));
  }, [router]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await saveProfile(userId, profile);
      router.push("/workbench/profile");
    } catch (caught) {
      setMessage({ ok: false, text: caught instanceof Error ? caught.message : String(caught) });
    } finally {
      setBusy(false);
    }
  }

  // Registered from a two-factor session; the passkey then replaces the email code at sign-in.
  async function addPasskey() {
    setMessage(null);
    const error = await addFingerprint();
    setMessage(error ? { ok: false, text: error } : { ok: true, text: "Fingerprint sign-in is set up. Next time, choose “Sign in with fingerprint or passkey”." });
  }

  if (!userId) return message ? <main style={s("min-height:100vh;display:flex;align-items:center;justify-content:center;color:#C8442F")}>{message.text}</main> : <Loader label="Loading your profile" />;
  return (
    <main style={s("max-width:640px;margin:0 auto;padding:40px 24px 96px;display:flex;flex-direction:column;gap:22px")}>
      <a href="/workbench"><img src={A["orvant-wordmark.png"]} alt="orvant" style={s("height:22px;width:auto;display:block")} /></a>
      <div style={s("font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.08em;color:#0045FD;margin-top:24px")}>YOUR PROFILE</div>
      <h1 style={s("margin:0;font-weight:400;font-size:32px;letter-spacing:-.02em;line-height:1.1")}>Details used to find trials for you</h1>
      <p style={s("margin:0;color:#4B5568;font-size:14px")}>These are your own answers, not a medical record. Results built on them still need checking with your care team.</p>
      <form onSubmit={save} style={s("display:flex;flex-direction:column;gap:14px;background:#FFFFFF;border:1px solid #E3E0D7;border-radius:24px;padding:28px")}>
        <ProfileFields value={profile} onChange={setProfile} />
        {message && <p role="alert" style={s(`margin:0;font-size:13px;color:${message.ok ? "#1F8A5B" : "#C8442F"}`)}>{message.text}</p>}
        <div style={s("display:flex;gap:10px;flex-wrap:wrap;align-items:center")}>
          <button className="btn-blue" disabled={busy} style={s(`font-size:15px;border:0;border-radius:999px;padding:12px 22px;background:#0045FD;color:#FFFFFF;opacity:${busy ? 0.6 : 1}`)}>{busy ? "Saving…" : "Save profile"}</button>
          <a href="/workbench" style={s("font-size:14px;padding:12px 14px")}>Cancel</a>
          <span style={s("margin-left:auto;display:flex;gap:4px;flex-wrap:wrap")}>
            <button type="button" onClick={addPasskey} style={s("font-size:14px;padding:12px 14px;border:0;background:none;color:#0045FD")}>Set up fingerprint sign-in</button>
            <a href="/mfa?add=1" style={s("font-size:14px;padding:12px 14px")}>Add a backup authenticator</a>
          </span>
        </div>
      </form>
    </main>
  );
}
