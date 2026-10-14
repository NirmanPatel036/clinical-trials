"use client";

import Link from "next/link";

import { RetrievalTrace } from "@/components/workbench/Advanced";
import { useWorkbench } from "@/components/workbench/context";
import { PlanCard } from "@/components/workbench/Search";
import { EmptyState, ICON, Icon, PageHead } from "@/components/workbench/ui";
import { s } from "@/lib/s";

export default function HowWeSearched() {
  const { run } = useWorkbench();
  return (
    <>
      <PageHead title="How we searched">How your last search was read and ranked. Useful if the results look off.</PageHead>
      {run ? (
        <div style={s("display:flex;flex-direction:column;gap:20px")}>
          <PlanCard plan={run.response.plan} query={run.request.query} />
          <RetrievalTrace run={run} />
        </div>
      ) : (
        <EmptyState art={<Icon d={ICON.plan} size={48} color="#D6D2C6" width={1.2} />} title="No search yet">
          Run a search in <Link href="/workbench/search" style={s("font-size:14px")}>Find trials</Link> and the details will show here.
        </EmptyState>
      )}
    </>
  );
}
