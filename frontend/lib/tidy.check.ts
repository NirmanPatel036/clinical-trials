// Run: node lib/tidy.check.ts
import assert from "node:assert/strict";

import { tidy } from "./tidy.ts";

assert.deepEqual(tidy("Sure! Here you go.\n## Trials\n1. A [NCT00000001]\n2) *B* trial\n\nI hope this helps!"),
  [{ kind: "p", lines: ["Here you go.", "**Trials**"] }, { kind: "ul", lines: ["A [NCT00000001]", "B trial"] }]);
assert.deepEqual(tidy("Two trials: - **A**: x - **B**: y"), [{ kind: "p", lines: ["Two trials:"] }, { kind: "ul", lines: ["**A**: x", "**B**: y"] }]);
assert.deepEqual(tidy("| Trial | Phase |\n|---|---|\n| A | 2 |"), [{ kind: "ul", lines: ["Trial · Phase", "A · 2"] }]);
assert.deepEqual(tidy("**Bold** stays, 2 * 3 too"), [{ kind: "p", lines: ["**Bold** stays, 2 * 3 too"] }]);
assert.deepEqual(tidy("- Drug study (NCT04750122) [ NCT04750122 ]"), [{ kind: "ul", lines: ["Drug study [NCT04750122]"] }]);
assert.deepEqual(tidy("Longer PFS (PMID: 39282896) and [PMID 38291745], code [ICD:C50.911]"), [{ kind: "p", lines: ["Longer PFS [PMID:39282896] and [PMID:38291745], code [ICD:C50.911]"] }]);
console.log("tidy: ok");
