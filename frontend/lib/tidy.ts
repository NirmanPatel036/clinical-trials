// Turns whatever a model wrote into paragraphs and bullet lists: headings become bold lines, tables and numbered
// lists become bullets, loose citations are normalised, run-on " - " bullets are split, and filler openers and closing offers are dropped.
export type Block = { kind: "p" | "ul"; lines: string[] };

const OPENER = /^\s*(sure|certainly|of course|absolutely|great question|good question)\b[^.!?\n]*[.!?]\s*/i;
const CLOSER = /(let me know|hope this helps|feel free to|happy to help|don't hesitate)/i;

export function tidy(text: string): Block[] {
  const lines = text.replace(/\r/g, "").replace(OPENER, "").replace(/\s+-\s+(?=\*\*)/g, "\n- ").split("\n").map((line) => line.trim())
    .filter((line) => !/^\|?\s*:?-{3,}/.test(line))
    .map((line) => line
      .replace(/^#{1,6}\s+(.+)$/, "**$1**")
      .replace(/^\|(.*)\|$/, (_, row: string) => "- " + row.split("|").map((cell) => cell.trim()).filter(Boolean).join(" · "))
      .replace(/^(\d+[.)]|[*•])\s+/, "- ")
      .replace(/__([^_]+)__/g, "**$1**")
      // "(NCT…)" and "[ NCT… ]" become citations; a citation repeated back to back is kept once.
      .replace(/[[(]\s*(NCT\d{8}(?:\s*[,;]\s*NCT\d{8})*)\s*[\])]/g, "[$1]")
      .replace(/\[(NCT\d{8})\](?:\s*\[\1\])+/g, "[$1]")
      // "(PMID: 123)" and "[PMID 123]" become [PMID:123], the form the answer view links to its article card.
      .replace(/[[(]\s*PMID:?\s*(\d+)\s*[\])]/g, "[PMID:$1]")
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1$2"));
  while (lines.length && (!lines.at(-1) || CLOSER.test(lines.at(-1)!))) lines.pop();
  const blocks: Block[] = [];
  let open = null as Block | null;
  for (const line of lines) {
    if (!line) { open = null; continue; }
    const kind = line.startsWith("- ") ? "ul" : "p";
    const body = kind === "ul" ? line.slice(2) : line;
    if (open?.kind === kind) open.lines.push(body);
    else blocks.push(open = { kind, lines: [body] });
  }
  return blocks;
}
