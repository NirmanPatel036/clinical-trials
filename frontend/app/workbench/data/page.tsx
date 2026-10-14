"use client";

import { Evaluation, System } from "@/components/workbench/Advanced";
import { useWorkbench } from "@/components/workbench/context";
import { PageHead } from "@/components/workbench/ui";
import { s } from "@/lib/s";

export default function AboutTheData() {
  const { stats, signOut } = useWorkbench();
  return (
    <>
      <PageHead title="About the data">Where the trials come from and how fresh the list is.</PageHead>
      <div style={s("display:flex;flex-direction:column;gap:20px")}>
        <System stats={stats} />
        <Evaluation onAuthLost={signOut} />
      </div>
    </>
  );
}
