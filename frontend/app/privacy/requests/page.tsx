import type { Metadata } from "next";

import { AccountData, Contact, Rows, Section, Title } from "@/components/Privacy";

export const metadata: Metadata = { title: "Access & deletion · Orvant" };

export default function DataRequests() {
  return (
    <>
      <Title kicker="Access & deletion" title="See, correct or delete your data">
        Some of this you can do yourself right now. The rest needs a request to the people who run Orvant.
      </Title>

      <Section id="self" title="Do it yourself">
        <AccountData />
        <p style={{ fontSize: 13, color: "#7A8293" }}>The download includes your account email, profile, Ask conversations with every message, and saved trials.</p>
      </Section>

      <Section id="request" title="By request">
        <p>These cannot be done in the app yet. Email <Contact /> from the address on your account and say what you want.</p>
        <Rows rows={[
          ["Delete your account", "Removes your sign-in record, profile, conversations and saved trials together. Your profile can’t be deleted on its own because name, year of birth, sex and diagnosis are needed for an account."],
          ["Access-log entries", "Entries about your matches are kept for 365 days and then deleted automatically. They can’t be removed one by one before then, even when your account is deleted, but you can ask for a copy."],
          ["Data held by outside services", <>Copies that AI providers, Resend or Supabase already received are governed by their own terms. We can’t delete those copies for you; you can contact those companies directly.</>],
        ]} />
        <p>We act only on requests sent from the email address on your account, so we know it’s you. We reply within 30 days.</p>
      </Section>

      <Section id="deleted" title="What deletion does and does not do">
        <ul>
          <li>Deleting a conversation removes it and all its messages from your account straight away.</li>
          <li>Deletion does not reach copies already sent to an AI provider or other outside service.</li>
          <li>Supabase’s database backups may hold copies of deleted data until those backups are replaced on Supabase’s normal schedule.</li>
        </ul>
      </Section>
    </>
  );
}
