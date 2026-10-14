"use client";

import { useRouter } from "next/navigation";

import { useWorkbench } from "@/components/workbench/context";
import { QueryBox, Results, Thinking } from "@/components/workbench/Search";
import { Notice, PageHead } from "@/components/workbench/ui";
import { profileText } from "@/lib/profile";
import { s } from "@/lib/s";

// Past this age the snapshot should not be relied on for status or recruitment facts.
const STALE_AFTER_DAYS = 7;

export default function FindTrials() {
  const router = useRouter();
  const { firstName, stats, profile, preset, pending, error, run, search, savedIds, toggleSave } = useWorkbench();
  const age = stats?.snapshot_age_days;
  return (
    <>
      <PageHead kicker={firstName ? `Hi ${firstName},` : undefined} title="Find clinical trials">
        Describe what you're looking for in your own words. We'll show recruiting trials and the registry text that matched.
      </PageHead>
      {age != null && age > STALE_AFTER_DAYS && (
        <div style={s("margin-bottom:16px")}><Notice tone="red">This trial list was last refreshed {age} days ago. Recruiting status may have changed; check each trial on ClinicalTrials.gov.</Notice></div>
      )}
      <QueryBox key={preset.key} busy={Boolean(pending)} initial={preset.request} profileText={profileText(profile)} onSearch={search} />
      <div style={s("margin-top:28px")}>
        {pending ? <Thinking query={pending} trials={stats?.trials} />
          : error ? <Notice tone="red">{error}</Notice>
          : <Results response={run?.response ?? null} query={run?.request.query ?? ""} stats={stats} onDetails={() => router.push("/workbench/details")} saved={savedIds} onToggleSave={toggleSave} />}
      </div>
    </>
  );
}
