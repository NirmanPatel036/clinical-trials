# Trial score, Not Applicable and lab rules

These are review aids. None of them is a probability of eligibility, and none has been validated on real patients.

## Criterion outcomes

| Outcome | Meaning | Effect on the score |
|---|---|---|
| `met` | the criterion's statement is true of the patient | inclusion: satisfied. exclusion: **blocking** |
| `not_met` | the facts contradict the statement | inclusion: **blocking**. exclusion: satisfied |
| `unknown` | the facts do not say | counted, never satisfied |
| `not_applicable` | the criterion cannot apply to this patient at all | left out entirely |

## Trial score (`match.score`)

```
applicable = every criterion that is not not_applicable
share      = satisfied / applicable
score      = round(100 x share)                    when nothing blocks
score      = round(100 x share x BLOCK_PENALTY)    when at least one criterion blocks   (BLOCK_PENALTY = 0.2)
```

- Unknown criteria stay in the denominator, so missing information can only lower the score.
- One failed inclusion or one triggered exclusion cuts the score to a fifth. Nine of ten satisfied with one
  blocker scores 18%, not 90%.
- No applicable criteria gives 0%, and the trial is labelled "potential match", never "criteria met".
- The label (`likely_excluded`, `potential_match`, `criteria_met`, each ending `_review_required`) is unchanged
  and still decides the wording. The score orders trials within the patient view; ties keep retrieval order.
- The score is recomputed whenever a rule, Jev or Gemini changes a finding.

Limitations:
- Every criterion weighs the same. A consent line counts as much as a biomarker requirement.
- 0.2 is a chosen constant, not a fitted one.
- The registry age and sex fields are scored as two criteria, and a trial that also writes its age limit in the
  criteria text counts age twice.
- Trials with long criteria lists score low until a judge has run, because most criteria start as unknown.
- A high score on a trial with few criteria means little. Read the breakdown, not the number alone.

## Not Applicable

A rule assigns it in one situation: the line speaks only to the other sex.

- Any such exclusion ("Pregnant or breastfeeding women" for a male patient).
- An inclusion only when worded as a condition ("Women of childbearing potential must have a negative pregnancy
  test"). "Female patients" is a requirement, so it is never set aside.
- The line must contain nothing else. "Pregnancy or uncontrolled diabetes" stays unknown, because the second
  half still applies.
- If the patient's sex is not recorded, nothing is set aside.

Jev and Gemini may also return it, under the same gates as any other decision: a verbatim fact line, and for Jev
the confidence threshold. Without evidence it becomes unknown.

On the TrialGPT annotations the rule made 2 such calls on the development split and 10 on the held-out split; the
physicians agreed with all 12. It finds 10–30% of the cases they marked, by design.

## Structured lab values (`backend/labs.py`)

A patient lab result has a name, value, unit, date and source. Add them to a patient record as:

```json
"labs": [{"name": "Hemoglobin", "value": 10.2, "unit": "g/dL", "measured_at": "2026-10-01", "source": "central lab"}]
```

A criterion is compared by rule only when all of these hold:
- it names exactly one known lab: haemoglobin, platelets, ANC, WBC, creatinine, creatinine clearance, bilirubin, AST, ALT, albumin, HbA1c;
- it has one comparator, one number and a unit we can convert (for example g/L to g/dL, /mm3 to 10^9/L, µmol/L to mg/dL);
- it is not relative ("x ULN", "baseline", "normal") and has no alternative ("or", "if", "unless");
- the patient has that lab, dated, in a convertible unit, and no older than the criterion's own window
  ("within 14 days") or 90 days when it gives none.

The newest usable result is compared, and the evidence line carries value, unit, date and source.

If the patient has the lab but it is undated, too old or in an unknown unit, the criterion is marked unknown **by
the rule**, and neither Jev nor Gemini may fill it in. If the patient has no such lab, the criterion goes to the
judges as before.

Limitations:
- "x ULN" thresholds need each laboratory's reference range, which is not modelled.
- Age of a result is measured against today's date, not a planned enrolment date.
- Eleven labs and a small unit table. An unlisted lab or unit simply falls through to the judges.
- The synthetic patients have no labs, so this path is exercised by tests only.
- eGFR is deliberately absent because the name collides with the EGFR biomarker.

## Field-weighted BM25 (experiment, not adopted)

`index.weighted_bm25(index, title_weight, eligibility_weight)` repeats title tokens in every chunk of a trial and
body tokens in eligibility chunks. `python -m backend.bm25_experiment` compares variants.

There is no relevance-labelled query set for this index, so the experiment is a known-item proxy: build a query
from one trial and see where that trial ranks (300 trials, BM25 only).

| Query built from | Unweighted recall@1 | Title x3 | Eligibility x2 | Title x3, eligibility x2 | Title x5, eligibility x3 |
|---|---|---|---|---|---|
| conditions + interventions | 0.933 | 0.923 | 0.943 | 0.930 | 0.923 |
| one inclusion criterion | 0.808 | 0.798 | 0.836 | 0.836 | 0.846 |
| the trial's own title (biased towards title weight) | 0.993 | 1.000 | 0.997 | 1.000 | 1.000 |

- Differences are one to four points on 300 queries, which is within sampling noise.
- Weighting eligibility text x2 is the only change that did not hurt any honest query style. Weighting titles
  helps only the query that is itself a title.
- The default index is unchanged. Adopting a weight needs real queries with relevance labels.
