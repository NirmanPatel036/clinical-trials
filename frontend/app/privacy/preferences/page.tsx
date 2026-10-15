import type { Metadata } from "next";
import Link from "next/link";

import { DeviceSettings, Rows, Section, Title } from "@/components/Privacy";

export const metadata: Metadata = { title: "Consent & preferences · Orvant" };

export default function ConsentAndPreferences() {
  return (
    <>
      <Title kicker="Consent & preferences" title="Your choices about what is shared">
        Only settings that actually change what Orvant does are shown here. Each one says exactly what it controls.
      </Title>

      <Section id="device" title="Settings on this device">
        <DeviceSettings />
      </Section>

      <Section id="asked" title="Choices you make as you go">
        <Rows rows={[
          ["Which AI answers in Ask", "Picked in Ask. Of the AI companies, only the one you picked receives your question and the earlier messages in that conversation."],
          ["Sending match details to model judges", <>Asked every time in <Link href="/workbench/match">Patient match</Link>, and only offered when the operator has switched the selective judge on. Your agreement covers that one run and is not stored. Rules-only matching never sends your details to an outside service.</>],
          ["Optional profile details", <>Stage, stage details, disease status, biomarkers, ECOG, medications, procedures and place can be left blank or cleared on <Link href="/profile">your profile</Link>. A blank field is treated as “not recorded”.</>],
          ["Saved history", <>Ask saves each conversation to your account automatically. You can delete conversations one by one in Ask, or all at once on the <Link href="/privacy/requests">Access & deletion</Link> page.</>],
        ]} />
      </Section>

      <Section id="none" title="What there is no setting for">
        <ul>
          <li><strong>Marketing email.</strong> Orvant only sends sign-up and sign-in codes, so there is nothing to opt out of.</li>
          <li><strong>Tracking cookies and analytics.</strong> The app does not use any.</li>
          <li><strong>Turning off Ask history.</strong> Not available yet. Delete conversations you don’t want kept.</li>
        </ul>
      </Section>
    </>
  );
}
