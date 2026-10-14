"use client";

import { useWorkbench } from "@/components/workbench/context";
import { ProfilePanel } from "@/components/workbench/Profile";
import { PageHead } from "@/components/workbench/ui";

export default function MyProfile() {
  const { profile, pending, findForProfile } = useWorkbench();
  return (
    <>
      <PageHead title="My profile">The details you gave us. We use them to find trials that accept your age and sex, ranked on your diagnosis.</PageHead>
      <ProfilePanel profile={profile} busy={Boolean(pending)} onFind={findForProfile} />
    </>
  );
}
