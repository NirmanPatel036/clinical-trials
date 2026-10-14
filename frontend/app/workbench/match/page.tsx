"use client";

import { useWorkbench } from "@/components/workbench/context";
import { MatchPanel } from "@/components/workbench/Match";
import { PageHead } from "@/components/workbench/ui";

export default function PatientMatch() {
  const { profile, stats, signOut, setMatch } = useWorkbench();
  return (
    <>
      {/* The user matches themselves, or the one synthetic patient every account has. */}
      <PageHead title="Patient match">Check yourself, or a synthetic patient, against each trial&apos;s criteria, one criterion at a time.</PageHead>
      <MatchPanel profile={profile} demoPatient={stats?.demo_patient ?? null} paidJudges={stats?.paid_judges ?? null} onAuthLost={signOut} onMatched={setMatch} />
    </>
  );
}
