"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EMPTY } from "@/lib/profile";
import { s } from "@/lib/s";
import { friendly } from "@/lib/passkey";
import { supabase } from "@/lib/supabase";

import { CODE_LENGTH, CodeInput } from "./CodeInput";
import { ProfileFields } from "./ProfileFields";

type Mode = "login" | "signup";

const COPY: Record<Mode, { title: string; lead: string; submit: string }> = {
  login: { title: "Sign in", lead: "We will email you a one-time code. No password needed.", submit: "Send code" },
  signup: { title: "Create your account", lead: "Tell us about yourself once, so trials can be filtered and ranked for you. You can change any of it later.", submit: "Send code" },
};
const INPUT = "border:1px solid #D6D2C6;border-radius:12px;padding:12px 14px;font-size:15px;color:#142237;background:#FFFFFF;width:100%";
const ARROW = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

/** Passwordless: the first submit emails a code, the second verifies it; /mfa then asks for the authenticator.
 * Sign-up sends the profile with the first; a database trigger moves it out of user metadata into `profiles`. */
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState(EMPTY);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) router.replace("/workbench"); });
  }, [router]);

  // A passkey replaces the email code; the authenticator step on /mfa still follows.
  async function passkey() {
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPasskey();
    setBusy(false);
    // No passkey on this device looks the same as a cancelled prompt; point to the email code, which offers setup afterwards.
    if (error) return setError(`${friendly(error)} No fingerprint set up on this device yet? Sign in with an email code and we'll offer to set one up.`);
    router.replace("/mfa");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = codeSent
      ? await supabase.auth.verifyOtp({ email, token: code, type: "email" })
      : await supabase.auth.signInWithOtp({ email, options: mode === "login" ? { shouldCreateUser: false } : { data: { profile } } });
    setBusy(false);
    if (result.error) return setError(result.error.message);
    if (!codeSent) return setCodeSent(true);
    router.replace("/mfa");
  }

  const copy = COPY[mode];
  return (
    <>
      <div style={s("font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.08em;color:#0045FD")}>ENTER THE WORKBENCH</div>
      <h1 style={s("margin:0;font-weight:400;font-size:32px;letter-spacing:-.02em;line-height:1.1")}>{copy.title}</h1>
      <p style={s("margin:0;color:#4B5568;font-size:14px")}>{codeSent ? `We sent a code to ${email}. It expires in 1 hour.` : copy.lead}</p>

      <form onSubmit={submit} style={s("display:flex;flex-direction:column;gap:14px")}>
        <label style={s("display:flex;flex-direction:column;gap:6px;font-size:13px;color:#4B5568")}>
          Email
          <input className="field" type="email" required autoComplete="email" readOnly={codeSent} value={email} onChange={(e) => setEmail(e.target.value)} style={s(INPUT)} />
        </label>
        {codeSent ? (
          <div style={s("display:flex;flex-direction:column;gap:6px;font-size:13px;color:#4B5568")}>
            Code from your email
            <CodeInput label="Code from your email" value={code} onChange={setCode} />
            <button type="button" onClick={() => { setCodeSent(false); setCode(""); setError(""); }}
              style={s("align-self:flex-start;border:0;background:none;padding:0;color:#0045FD;font-size:12px")}>Use a different email</button>
          </div>
        ) : mode === "signup" && (
          <>
            <div style={s("font-family:var(--font-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.08em;color:#7A8293;border-top:1px solid #E3E0D7;padding-top:16px;margin-top:6px")}>ABOUT YOU</div>
            <ProfileFields value={profile} onChange={setProfile} />
          </>
        )}
        {error && <p role="alert" style={s("margin:0;font-size:13px;color:#C8442F")}>{error}</p>}
        <button className="btn-blue" disabled={busy || (codeSent && code.length < CODE_LENGTH)}
          style={s(`font-size:15px;border:0;border-radius:999px;padding:14px 22px;background:#0045FD;color:#FFFFFF;display:flex;justify-content:center;align-items:center;gap:8px;opacity:${busy ? 0.6 : 1}`)}>
          {busy ? "Working…" : codeSent ? "Continue" : copy.submit}{ARROW}
        </button>
      </form>
      {mode === "login" && !codeSent && (
        <button type="button" className="btn-line" disabled={busy} onClick={passkey}
          style={s("font-size:15px;border:1px solid #D6D2C6;border-radius:999px;padding:13px 22px;background:transparent;color:#142237;display:flex;justify-content:center;align-items:center;gap:8px;margin-top:-8px")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4M14 13.12c0 2.38 0 6.38-1 8.88M17.29 21.02c.12-.6.43-2.3.5-3.02M2 12a10 10 0 0 1 18-6M2 16h.01M21.8 16c.2-2 .131-5.354 0-6M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2M8.65 22c.21-.66.45-1.32.57-2M9 6.8a6 6 0 0 1 9 5.2v2" /></svg>
          Sign in with fingerprint or passkey
        </button>
      )}

      <div style={s("font-size:13px;color:#4B5568;border-top:1px solid #E3E0D7;padding-top:16px")}>
        {mode === "login" ? <>No account? <a href="/signup">Create one</a></> : <>Already have an account? <a href="/login">Sign in</a></>}
      </div>
    </>
  );
}
