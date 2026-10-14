"use client";

import { useWorkbench } from "@/components/workbench/context";
import { MatchResults } from "@/components/workbench/Match";
import { PageHead } from "@/components/workbench/ui";

export default function PatientMatchResults() {
  const { match } = useWorkbench();
  return (
    <>
      <PageHead title="Match results">{match?.patient_id === "self" ? "Your" : "The patient’s"} trials, scored criterion by criterion. Every result needs clinician review.</PageHead>
      <MatchResults match={match} />
    </>
  );
}
