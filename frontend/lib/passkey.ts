// Passkeys held by this device's fingerprint or face sensor (Touch ID, Windows Hello, Android biometrics).
import { supabase } from "./supabase";

type Json = Record<string, unknown>;
// WebAuthn Level 3 JSON helpers; recent Chrome, Edge, Firefox and Safari have them, older browsers fall back.
type JsonWebAuthn = { parseCreationOptionsFromJSON(options: Json): PublicKeyCredentialCreationOptions };

/** True when the device has a built-in sensor that can hold a passkey. */
export async function hasFingerprintSensor() {
  return typeof PublicKeyCredential !== "undefined" && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false));
}

export async function hasPasskey() {
  const { data } = await supabase.auth.passkey.list();
  return (data?.length ?? 0) > 0;
}

/** Registers a passkey on this device's own sensor, not a phone or security key. Returns an error message, or null on success. */
export async function addFingerprint(): Promise<string | null> {
  const native = typeof PublicKeyCredential !== "undefined" && "parseCreationOptionsFromJSON" in PublicKeyCredential;
  if (!native) {
    const { error } = await supabase.auth.registerPasskey();
    return error ? friendly(error) : null;
  }
  const { data, error } = await supabase.auth.passkey.startRegistration();
  if (error || !data) return error?.message ?? "Could not start setting up your fingerprint.";
  const options = data.options as unknown as Json;
  const publicKey = (PublicKeyCredential as unknown as JsonWebAuthn).parseCreationOptionsFromJSON({
    ...options,
    authenticatorSelection: { ...(options.authenticatorSelection as Json), authenticatorAttachment: "platform", residentKey: "required", userVerification: "required" },
    hints: ["client-device"],
  });
  try {
    const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential;
    const { error: verifyError } = await supabase.auth.passkey.verifyRegistration({ challengeId: data.challenge_id, credential: credential.toJSON() as never });
    return verifyError ? verifyError.message : null;
  } catch (caught) {
    return friendly(caught);
  }
}

/** WebAuthn reports a cancelled prompt and "no passkey here" with the same NotAllowedError; say what to do instead. */
export function friendly(error: unknown) {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  if (/NotAllowed|not allowed|cancel|abort/i.test(text)) return "The fingerprint prompt was closed or timed out.";
  if (/InvalidState|already registered|exclude/i.test(text)) return "This device already has a passkey for your account.";
  return error instanceof Error ? error.message : text;
}
