import type { Metadata } from "next";

import { DecisionSupport, Rows, Section, Title } from "@/components/Privacy";

export const metadata: Metadata = { title: "Data & security · Orvant" };

export default function DataAndSecurity() {
  return (
    <>
      <Title kicker="Data & security" title="How patient information is handled">
        The protections built into Orvant today, and what we do not promise.
      </Title>

      <Section id="access" title="Who can see your health information">
        <Rows rows={[
          ["Two sign-in steps", "Signing in takes an email code (or a passkey) and then a code from your authenticator app. Your profile, conversations and saved trials can only be read from a session that has passed both steps."],
          ["Your rows only", "The database checks every read and change: an account can only reach its own profile, conversations and saved trials. This is enforced by the database itself (row-level security), not just by the app."],
          ["The API checks too", "Trial search, Ask and Patient match refuse any request without a valid sign-in that has passed the authenticator step."],
          ["Synthetic patients", "Each account can match one shared demo patient, plus any synthetic patients the operator has granted it. Grants can only be set by the operator. A refused attempt is logged."],
          ["Administrator access", "Only Nirman Patel, who runs Orvant, has administrator access to the database and the server’s files, and uses it only to run the service and handle your requests."],
        ]} />
      </Section>

      <Section id="minimise" title="Sending only what is needed">
        <ul>
          <li>Your profile is kept in its own protected table. Apart from your name, it is not copied into your sign-in token, which travels with every request.</li>
          <li>Patient match sends our server your age (worked out in your browser from your year of birth), sex, diagnosis, stage, stage details, disease status, biomarkers, ECOG, medications and procedures. The server refuses a request that includes anything more, such as a name or place.</li>
          <li>Outside searches in Ask (PubMed, ICD-10-CM) get topic words with personal details filtered out. Your profile is never sent to them.</li>
          <li>Logs record that something happened, not your health details. See below.</li>
        </ul>
      </Section>

      <Section id="logs" title="Audit logging">
        <Rows rows={[
          ["Access log", "Written for every patient match, allowed or refused: time, account ID, patient ID (or “self” for your own profile), outcome, trial IDs returned and index version."],
          ["Decision log", "Written when the selective judge runs: trial ID, a short fingerprint of the criterion text, the finding, which judge decided, confidence, timing and model usage. No account ID, patient ID or patient facts."],
          ["Where", "A restricted Google Cloud log store, kept for 365 days and then deleted automatically. Only the administrator can read it; there is no screen for it in Orvant."],
        ]} />
      </Section>

      <Section id="encryption" title="Hosting and encryption">
        <p>The website and API are hosted on Google Cloud, and the database runs on Supabase. The Orvant code does not add encryption of its own, so stored data is protected by those providers’ standard safeguards.</p>
        <p>We do not make any further encryption promises.</p>
      </Section>

      <Section id="ai" title="External AI processing">
        <Rows rows={[
          ["Ask: Gemini, Groq, Hugging Face or OpenRouter", "The model you pick receives your question as typed, up to nine earlier messages from the conversation, and the trial text used for the answer."],
          ["Patient match, rules only (default)", "Nothing goes to an AI service."],
          ["Patient match, selective judge", "Off unless the operator turns it on, and you must agree before each run. TypeSafe (Jev) and then Groq receive your match details and the open criteria. Name, email, year of birth and place are never sent. An answer only counts if it quotes one of your fact lines word for word."],
        ]} />
        <p>Answers are checked against the trial text before you see them: quotes and trial numbers that are not in that text are removed and listed as limitations.</p>
      </Section>

      <Section id="device" title="On your device">
        <p>Your browser keeps your sign-in session until you sign out. On a shared computer, always sign out. A match export or data download is a normal file on your device and is not protected by Orvant once saved.</p>
      </Section>

      <Section id="limits" title="What we do not claim">
        <p>Orvant holds no security certifications and does not claim compliance with HIPAA, India’s DPDP Act or any other law or standard. No independent security review or penetration test has been done yet.</p>
      </Section>
      <DecisionSupport />
    </>
  );
}
