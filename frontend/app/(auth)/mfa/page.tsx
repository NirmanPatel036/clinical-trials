"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CODE_LENGTH, CodeInput } from "@/components/CodeInput";
import { s } from "@/lib/s";
import { supabase } from "@/lib/supabase";

const MONO = "font-family:var(--font-mono),ui-monospace,monospace";
type Step = { kind: "loading" } | { kind: "verify"; factorId: string } | { kind: "enroll"; factorId: string; qr: string; secret: string; backup: boolean };

/** Second factor (authenticator app): set one up on first sign-in, enter a code every sign-in after. ?add=1 adds a backup device. */
export default function MfaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Dev mode runs effects twice; two concurrent enrolments collide in Supabase, so set up only once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace("/login");
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError || !factors || !aal) return setError(listError?.message ?? "Could not read your authenticator settings.");
      const adding = new URLSearchParams(window.location.search).has("add") && aal.currentLevel === "aal2";
      const verified = factors.totp;
      if (verified.length && !adding) {
        if (aal.currentLevel === "aal2") return router.replace("/workbench");
        return setStep({ kind: "verify", factorId: verified[0].id });
      }
      // A setup abandoned half way leaves an unverified factor behind; clear it before starting again.
      for (const factor of factors.all.filter((f) => f.status === "unverified")) await supabase.auth.mfa.unenroll({ factorId: factor.id });
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator added ${new Date().toISOString()}` });
      if (error) return setError(error.message);
      setStep({ kind: "enroll", factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret, backup: adding });
    })();
  }, [router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (step.kind === "loading") return;
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: step.factorId, code });
    setBusy(false);
    if (error) return setError(error.message);
    router.replace(step.kind === "enroll" && step.backup ? "/profile" : "/workbench");
  }

  const signOut = async () => { await supabase.auth.signOut(); router.replace("/login"); };

  return (
    <>
      <div style={s(`${MONO};font-size:11px;letter-spacing:.08em;color:#0045FD`)}>SECOND FACTOR</div>
      <h1 style={s("margin:0;font-weight:400;font-size:32px;letter-spacing:-.02em;line-height:1.1")}>
        {step.kind === "verify" ? "Enter your authenticator code" : step.kind === "enroll" && step.backup ? "Add a backup authenticator" : "Set up your authenticator"}
      </h1>
      <p style={s("margin:0;color:#4B5568;font-size:14px")}>
        {step.kind === "verify" ? "Open your authenticator app and type the 6-digit code for Orvant."
          : "Your profile holds health details, so every sign-in needs a code from an authenticator app (Google Authenticator, 1Password, Authy…) as well as your email."}
      </p>

      {step.kind === "loading" ? (
        error ? <p role="alert" style={s("margin:0;font-size:13px;color:#C8442F")}>{error}</p> : <p style={s("margin:0;color:#7A8293;font-size:14px")}>Checking your account…</p>
      ) : (
        <form onSubmit={submit} style={s("display:flex;flex-direction:column;gap:14px")}>
          {step.kind === "enroll" && (
            <div style={s("display:flex;gap:20px;align-items:center;flex-wrap:wrap;background:#FFFFFF;border:1px solid #E3E0D7;border-radius:16px;padding:16px")}>
              <img src={step.qr} alt="QR code to scan with your authenticator app" width={160} height={160} style={s("display:block")} />
              <div style={s("flex:1;min-width:180px;font-size:13px;color:#4B5568;display:flex;flex-direction:column;gap:6px")}>
                Scan this with your app. Can't scan? Enter this key instead:
                <code style={s(`${MONO};font-size:12px;color:#142237;overflow-wrap:anywhere;user-select:all`)}>{step.secret}</code>
              </div>
            </div>
          )}
          <div style={s("display:flex;flex-direction:column;gap:6px;font-size:13px;color:#4B5568")}>
            6-digit code from your app
            <CodeInput label="Authenticator code" value={code} onChange={setCode} />
          </div>
          {error && <p role="alert" style={s("margin:0;font-size:13px;color:#C8442F")}>{error}</p>}
          <button className="btn-blue" disabled={busy || code.length < CODE_LENGTH}
            style={s(`font-size:15px;border:0;border-radius:999px;padding:14px 22px;background:#0045FD;color:#FFFFFF;opacity:${busy ? 0.6 : 1}`)}>
            {busy ? "Checking…" : step.kind === "enroll" ? "Turn on and continue" : "Enter workbench"}
          </button>
        </form>
      )}

      <div style={s("font-size:13px;color:#4B5568;border-top:1px solid #E3E0D7;padding-top:16px")}>
        {step.kind === "enroll" && step.backup ? <a href="/profile">Back to your profile</a>
          : <>Lost your authenticator? Contact support to have it reset. <button type="button" onClick={signOut} style={s("border:0;background:none;padding:0;color:#0045FD;font-size:13px")}>Sign out</button></>}
      </div>
    </>
  );
}
