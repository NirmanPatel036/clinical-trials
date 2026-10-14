"use client";

import { useRouter } from "next/navigation";

import { useWorkbench } from "@/components/workbench/context";
import { SavedTrials } from "@/components/workbench/Search";
import { PageHead } from "@/components/workbench/ui";

export default function Saved() {
  const router = useRouter();
  const { saved, toggleSave } = useWorkbench();
  return (
    <>
      <PageHead title="Saved trials">Trials you bookmarked. Bring the list to your care team to talk them through.</PageHead>
      <SavedTrials trials={saved} onRemove={toggleSave} onFind={() => router.push("/workbench/search")} />
    </>
  );
}
