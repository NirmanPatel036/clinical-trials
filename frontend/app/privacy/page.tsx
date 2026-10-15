import type { Metadata } from "next";
import Link from "next/link";

import { Contact, DecisionSupport, Rows, Section, Title } from "@/components/Privacy";

export const metadata: Metadata = { title: "Privacy policy · Orvant" };

export default function PrivacyPolicy() {
  return (
    <>
      <Title kicker="Privacy policy" title="How Orvant handles your information">
        What we collect, why, where it goes and what you can do about it, in plain words. Where Orvant does not make a promise, the page says so.
      </Title>
      <DecisionSupport />

      <Section id="who" title="Who is responsible">
        <p>Orvant is run by Nirman Patel, who is responsible for your information. Questions about this policy go to <Contact />.</p>
        <p>This policy covers the Orvant website and workbench. It does not cover ClinicalTrials.gov, PubMed or any site a link takes you to.</p>
      </Section>

      <Section id="kinds" title="Three different kinds of data">
        <Rows rows={[
          ["Public trial and research data", <>Trial records from ClinicalTrials.gov, and, in Ask, PubMed abstracts, ICD-10-CM diagnosis codes and RxNorm drug names from the U.S. National Library of Medicine. This is published information about trials and research. It is not about you.</>],
          ["Your account", <>Your email address, your name, and your sign-in methods (authenticator app, and passkeys if you add one).</>],
          ["Health information you give us", <>Your profile (year of birth, sex, diagnosis, stage, stage details, disease status, biomarkers, ECOG score, medications, procedures, city, state and country), the questions you type in Ask and the answers saved with them, and the trials you save.</>],
        ]} />
        <p>Patient match can also run on <strong>synthetic patients</strong>. These are made-up records; no real person is behind them.</p>
      </Section>

      <Section id="collect" title="What we collect and why">
        <Rows rows={[
          ["Email address", "To create your account and send you sign-up and sign-in codes. These are the only emails Orvant sends."],
          ["Name", "To greet you in the workbench. It is also kept on your sign-in record so the account is recognisable to the operator."],
          ["Profile details", "To find trials that accept your age and sex, ranked on your diagnosis, and to match you against each trial’s criteria when you ask. Everything except name, year of birth, sex and diagnosis is optional."],
          ["Ask questions and answers", "To answer your question, and to keep your conversation history so you can come back to it."],
          ["Saved trials", "To keep your bookmarks."],
          ["Access log entries", <>To keep a record of who ran a patient match. Each entry holds the time, your account ID, which patient was matched (a synthetic patient’s ID, or “self”), whether access was allowed, the trial IDs returned and the index version. No health details are written to it.</>],
        ]} />
        <p>Searches in Find trials are processed on our server to rank trials. The application does not store them.</p>
        <p>We use your health information because you choose to give it to us and ask Orvant to use it. You can take that back at any time by clearing profile fields, deleting your data, or asking us to delete your account.</p>
      </Section>

      <Section id="ai" title="AI processing: what is sent to outside AI services">
        <p><strong>Ask.</strong> Your question is sent, exactly as you typed it, to the AI company whose model you picked: Google (Gemini), Groq, Hugging Face or OpenRouter. Up to nine earlier messages from the same conversation go with it, along with the trial text the answer is based on. Your profile is not added. Anything you type, such as your name, age or town, <em>is</em> sent, so leave out what you don’t want shared.</p>
        <p><strong>Patient match, rules only.</strong> This is the default. Your details are checked against trial criteria on our server and are not sent to any AI service.</p>
        <p><strong>Patient match with the selective judge.</strong> This is off unless the operator turns it on, and each run asks you to agree first. When it runs, your match details (age, sex, diagnosis, stage, stage details, disease status, biomarkers, ECOG, medications and procedures) and the criteria still undecided are sent to TypeSafe (its Jev model). Criteria Jev should not decide alone also go to Groq. Your name, email, year of birth and place are never sent.</p>
        <p>Each of these companies handles what it receives under its own published terms, including how long it keeps it and whether it may use it to improve its models. Orvant does not control that, so don’t send anything you would not want them to have.</p>
      </Section>

      <Section id="other" title="Other outside services">
        <Rows rows={[
          ["Supabase", <>Holds your account, profile, conversations and saved trials, and handles sign-in. </>],
          ["Resend", "Delivers sign-up and sign-in emails. It receives your email address and the one-time code."],
          ["PubMed (NCBI)", "When PubMed is switched on in Ask, or a question asks for papers: topic words from the question. Ages, emails, long numbers, pronouns, family words and place names in the trial index are removed first. This is an automatic filter, so unusual wording can slip through."],
          ["ICD-10-CM (NLM Clinical Tables)", "When a question asks about diagnosis codes: the condition names, or the filtered topic words."],
          ["RxNorm (NLM RxNav)", "When a question names prior treatment, such as “after Tagrisso”: up to three words that follow phrases like “after” or “progressed on”, to look up generic drug names."],
          ["Google Cloud", "Hosts the Orvant website and API and keeps the access log. Like any web host, it also records each request: the time, the page asked for, your IP address and your browser. These request records are kept for 30 days."],
        ]} />
        <p>The app has no advertising or analytics code. Apart from the services above, the application code does not send your information anywhere.</p>
        <p>We do not sell your information, and we do not share it for advertising.</p>
      </Section>

      <Section id="storage" title="Where it is stored and for how long">
        <Rows rows={[
          ["Profile", "In Supabase until your account is deleted. You can edit or clear the optional fields at any time."],
          ["Ask conversations", "In Supabase until you delete them or your account is deleted."],
          ["Saved trials", "In Supabase until you remove them or your account is deleted."],
          ["Match results", "Not stored on our server. They stay in your browser tab until you run another match, reload or sign out. An export file you download stays on your device."],
          ["Access log", "In a restricted Google Cloud log store for 365 days, then deleted automatically. Entries can’t be removed one by one before then, and deleting your account doesn’t remove them. They hold your account ID but no health details."],
          ["This browser", "Your sign-in session and a few settings (answer model, PubMed switch, sidebar layout). Signing out ends the session. You can clear the settings on the Consent & preferences page."],
        ]} />
        <p>Apart from the access log and request records, nothing is deleted on a timer: we keep your data for as long as your account exists, unless you delete it sooner. Supabase’s database backups may hold copies of deleted data until those backups are replaced on Supabase’s normal schedule.</p>
      </Section>

      <Section id="rights" title="Your choices and rights">
        <p>You can see and correct your profile, delete your Ask conversations and saved trials, and download a copy of your account data yourself. Deleting your whole account, and anything else, is done on request. See <Link href="/privacy/requests">Access & deletion</Link>.</p>
        <p>Wherever you live, you can ask us for a copy of your data, to correct it or to delete it, by emailing <Contact />. We reply within 30 days. Orvant does not claim compliance with HIPAA, India’s DPDP Act or any other law or standard.</p>
      </Section>

      <Section id="children" title="Children and young people">
        <p>Orvant has no minimum age. If you are under 18, we encourage you to use it with a parent, guardian or your care team, and to talk through any results with them.</p>
      </Section>

      <Section id="changes" title="Changes and contact">
        <p>When this policy changes, the date at the top changes too. Before a significant change takes effect, we email account holders.</p>
        <p>Contact: Nirman Patel, <Contact />.</p>
      </Section>
    </>
  );
}
