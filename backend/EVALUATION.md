# Evaluation

Status on 2026-10-14: both harnesses are built and tested offline. The rule baseline has been run everywhere.
Jev has been run once on the **development** split (Gemini on 6 of 50 pairs) and once on the **held-out** split
(Gemini unavailable, so rules + Jev only). Every further paid run needs `--allow-api`.

Nothing here is evidence of clinical reliability. The only patient-level labels available publicly are a
physician consensus on synthetic patients. See "What still needs clinician-labelled cases".

## Datasets at a glance

| Resource | Obtained | Licence / access | Patients | Labels | Clinician review of patient-specific eligibility | Used for |
|---|---|---|---|---|---|---|
| CHIA | Yes | CC BY 4.0, open | none | spans in criteria text | n/a (no patients) | extraction, criterion interpretation |
| Leaf Clinical Trials Corpus (LCT) | Yes | CC BY 4.0, open | none | spans in criteria text | n/a (no patients) | extraction, criterion interpretation |
| TrialGPT criterion annotations | Yes | NLM public-domain notice, open, not gated | 53, synthetic | per criterion: 4 classes each for inclusion and exclusion | Yes: three physicians, consensus. Formed while reviewing GPT-4 output, so not blind | Met / Not Met / Unknown decisions |
| n2c2 2018 Track 1 | **No** | registration + signed Data Use Agreement | 288, real, de-identified | 13 fixed criteria, met / not met | Yes: two medical experts, independently | not integrated (see below) |
| TrialMatchAI Zenodo record | Partly (synthetic profiles only) | CC BY 4.0, open | 100 synthetic | originating trial ID only | No | not used for decisions |
| TrialMatchAI real-world cohort | **No** | not in the public record | 52, real (NKI) | trial assignments; expert review of model output | reported, not verifiable from public files | unavailable |
| Inato real-world set (arXiv:2503.15374) | **No** | no release statement found | 485, real | reported criterion accuracy | reported, not verifiable | unavailable |

Everything obtained lives in `backend/data/public/` (git-ignored) and is checksum-verified before use.

## Provenance and access, per resource

### CHIA
- Kury et al., *Scientific Data* 2020, doi:10.1038/s41597-020-00620-0. Columbia University.
- figshare doi:10.6084/m9.figshare.11855817, `chia_with_scope.zip`, 2.5 MB, MD5 `54b33164da88da88e47b2a009e150a82`.
- 1,000 interventional Phase IV trials. Brat standoff, two documents per trial (`_inc`, `_exc`), one criterion per line.
- Entities include Condition, Drug, Procedure, Measurement, Person, Value, Temporal, Negation, Qualifier, Scope;
  relations include Has_value, Has_temporal, Has_negation, AND, OR.
- Loaded: 12,382 annotated criterion lines.

### Leaf Clinical Trials Corpus
- Dobbins et al., *Scientific Data* 2022, doi:10.1038/s41597-022-01521-0. University of Washington.
- figshare doi:10.6084/m9.figshare.17209610, `lct_corpus.tar.gz`, 1.3 MB, MD5 `ebef197bd415d7b84b15bbd79cfef5d4`.
- 1,006 trials, randomly sampled, registered from 2018, all disease areas. Brat standoff, one document per trial
  in the registry's own layout. 50 entity types (Age, Eq-Comparison, Negation, Condition, ...) and 51 relation types.
- Entity agreement F1 76–78%; 89% of documents single-annotated; about half machine pre-annotated then corrected.
- Loaded: 8,102 annotated criterion lines.

### TrialGPT criterion annotations
- Jin et al., "Matching patients to clinical trials with large language models", *Nature Communications* 2024. NLM/NCBI.
- Hugging Face `ncbi/TrialGPT-Criterion-Annotations`, one parquet file, 176 KB, MD5 `188bfcfa30e6afd366c9333cb18d4887`.
  The LICENSE file is NCBI's public-domain notice and asks for citation.
- 1,015 patient–criterion pairs (1,014 with criterion text) from 105 patient–trial pairs, 53 patients, 103 trials,
  sampled from the SIGIR 2016 cohort. The paper describes that cohort's patients as synthetic.
- Labels. Inclusion: included, not included, not enough information, not applicable. Exclusion: excluded, not
  excluded, not enough information, not applicable. Also the sentence numbers the experts used as evidence.
- **How the labels were made:** three physicians annotated GPT-4's criterion-level output (its explanation,
  sentences and prediction) and a consensus became the ground truth. They are expert labels, but not blind to a
  model's answer.
- Label mix is lopsided: 484 "not excluded" against 10 "excluded"; 23 "not included".
- The file's `training` column is undocumented and is not used.

### n2c2 2018 Track 1 (cohort selection) — not obtained
- Stubbs et al., *JAMIA* 2019. Records derive from the 2014 i2b2/UTHealth corpus.
- 288 patients (202 train, 86 test), 1,267 records, 13 criteria such as HBA1C, CREATININE, MI-6MOS, each labelled
  met or not met. Two medical experts annotated every record independently. There is no "unknown" class.
- Access is through the Harvard DBMI Data Portal after registration and a signed Data Use Agreement. The portal
  refused an anonymous request, so the details above come from papers that used the data, not from the portal.
- The agreement, as quoted in arXiv:2501.11114, says the user "will not disclose, disseminate, or otherwise share
  the Data / Datasets to or with any other person or entity". That paper restricted itself to local models for
  this reason. Sending these records to Jev or Gemini would very likely breach the agreement.
- **Not integrated.** Three reasons: we do not hold the data; hosted APIs are ruled out; and the rule baseline has
  nothing to say about its 13 criteria. It becomes usable only with a signed agreement and a locally hosted model.

### TrialMatchAI
- Abdallah et al., *Nature Communications* 17, 4472 (2026), doi:10.1038/s41467-026-70509-w; preprint arXiv:2505.08508.
  The journal page sits behind a sign-in redirect, so the details below are from the preprint and the Zenodo record.
- Zenodo doi:10.5281/zenodo.15045515, CC BY 4.0, open. Files: `perfect_patient_profiles.json` (0.5 MB),
  `finetuning_datasets.zip` (44 MB), `matching_results.zip` (125 MB), `normalization_dictionaries.zip` (30 MB),
  `models.zip` (1.9 GB), `clinical_trials.zip` (1.7 GB).
- Obtained: `perfect_patient_profiles.json`, MD5 `439e0507127b221cccf81d823da847b3`. It holds 101 "Ideal Candidates"
  profiles (the paper says 100), each written by GPT-4o-mini from one trial and "manually curated". The only label
  is the originating trial. There are no criterion labels and no clinician eligibility labels.
- Not downloaded: `matching_results.zip` is the system's own output; `finetuning_datasets.zip` is training data
  whose label provenance I could not verify. Neither is a reference standard.
- Only 2 of the 101 originating trials are in our index, so the profiles cannot test our retrieval either.
- **Real-world cohort:** 52 metastatic cancer patients from the WIDE study at the Netherlands Cancer Institute,
  with the trials they were assigned to. It is not in the Zenodo record, whose description lists synthetic data only.
- **Expert review:** the preprint reports expert assessment of 1,050 patient–criterion pairs (950 from synthetic
  TREC patients). That is a review of TrialMatchAI's own outputs, published as supplementary sheets I could not
  open. Who the experts were and whether they worked independently is not established here.

### The "real-world expert-reviewed" datasets in the literature
- TrialMatchAI's NKI cohort (above): real patients, not released.
- Callies et al., arXiv:2503.15374 (Inato): 485 patients from 30 sites against 36 trials, 87% reported accuracy.
  No data availability statement was found.
- Conclusion: no real-world, clinician-reviewed patient–trial dataset is publicly downloadable. A paper describing
  one is not access to it.

## Harness 1: criterion extraction and interpretation (`backend/evaluate.py`)

Uses CHIA and LCT. One item is one criterion line with at least one annotation.

| Task | Reference, derived by us from the annotations |
|---|---|
| `numeric_or_temporal` | CHIA: a `Temporal` entity, or a `Value`/`Multiplier` containing a digit. LCT: an `Eq-Comparison` entity |
| `negated` | a `Negation` entity |
| `age` | CHIA: a `Person` entity reading "age", "aged" or "old". LCT: an `Age` entity |

The annotators marked spans; they did not answer these questions. Report results as "agreement with labels
derived from CHIA/LCT annotations".

Rule baseline, all lines:

| Corpus | Task | Reference positive | Precision | Recall | F1 |
|---|---|---|---|---|---|
| CHIA | numeric_or_temporal | 38.1% | 0.920 | 0.778 | 0.843 |
| CHIA | age (`age_bounds`) | 5.2% | 0.995 | 0.605 | 0.753 |
| LCT | numeric_or_temporal | 49.2% | 0.999 | 0.586 | 0.738 |
| LCT | age (`age_bounds`) | 8.6% | 0.998 | 0.661 | 0.795 |

Extraction on LCT: 988 of 1,006 documents split into items; 97.8% of annotated entities fall inside one item.

- **All of these are development figures.** Both detectors were revised after inspecting their errors on these corpora.
- **Correction to the previous version of this file.** It said the old age pattern was wrong "about 1 time in 5
  on CHIA". That overstated it: my CHIA mapping missed lines annotated as "years old". With the mapping fixed the
  old pattern's precision was 0.90 (CHIA) and 0.92 (LCT). The false matches were real ("gestational age",
  "age-related macular degeneration", "bone age", "weight-for-age").
- The new age parser's three remaining "false matches" are genuine age limits the annotators did not tag.
- Its lower recall is deliberate: anything that is not a plain age range in years is left for a judge.
- `numeric_or_temporal` no longer routes anything. It is kept as a reporting slice, because numeric and date
  criteria now go to Jev and their error rates need watching separately.

## Harness 2: Met / Not Met / Unknown decisions (`backend/evaluate_decisions.py`)

Uses the TrialGPT annotations. Each patient–trial pair becomes the same objects the product uses: the note's
sentences are the fact lines, age and sex are read from the note deterministically, and the criteria go through
`assess()`, then the system under test.

Label mapping: included / excluded → `met`; not included / not excluded → `not_met`; not enough information →
`unknown`; not applicable → `not_applicable` (55 rows). Until 2026-10-13 the last class was left out, so the live
run below was scored on 504 development criteria; from now on all 525 are scored. A "not applicable" mismatch is
never counted as a false inclusion or exclusion.

Systems: `rule` (rules only), `jev` (rules, then Jev, no escalation), `gemini` (rules, then the existing Gemini
judge), `selective` (rules, Jev, escalation to Gemini: the product path).

Metrics:
- accuracy, per-class precision / recall / F1, macro F1;
- **false inclusions** (decided in the patient's favour, expert said the opposite) and **false exclusions**
  (decided against, expert said the opposite), counted separately, plus decisions made where the expert said unknown;
- abstention: coverage, accuracy when decided, abstentions the expert agreed with, abstentions the expert could decide;
- calibration of Jev's raw confidence: expected calibration error, Brier score, accuracy and coverage by threshold;
- escalation rate and reasons; latency per criterion and per pair; Jev tokens; estimated Gemini input tokens; cost
  when per-million-token prices are supplied;
- the same decision metrics for numeric/date criteria alone;
- how often the cited sentence is one the experts cited.

### Development and held-out

Patients are split by a hash of the patient ID: 25 patients / 50 pairs / 504 scored criteria in `dev`, 28 patients
/ 55 pairs / 455 scored criteria in `held_out`. No patient is in both. The command defaults to `dev`; `held_out`
must be asked for.

Rule baseline (the only system run so far):

| Split | Decided by rule | Agree with experts | False inclusions | False exclusions | Coverage |
|---|---|---|---|---|---|
| dev | 21 of 504 | 21 | 0 | 0 | 4.2% |
| held_out | 11 of 455 | 11 | 0 | 0 | 2.4% |

- The dev row is a development figure. The first run decided 23 lines and got one wrong: "Women aged 15–45 years
  resident in the predefined study area" was called met on age alone. The rule now calls a criterion met only when
  the line is nothing but an age range.
- The held-out row was run once, after that change, and the rules have not been touched since. It is a small
  sample (11 decisions), all age criteria. The rules abstain on everything else.
- Tune thresholds and prompts on `dev` only. Jev has now seen `held_out` once (2026-10-14, below); Gemini has not.
- **Second rule run, after the "not applicable" rule was added** (scoring all classes): dev 23 of 525 decided, held-out
  21 of 489 decided, every one agreeing with the experts, no false inclusions or exclusions. The rule found 2 of 21
  "not applicable" cases on dev and 10 of 34 on held-out, all correct. This is the rules' second look at the
  held-out split, so treat it as a check, not a fresh estimate. Scoring logic is in `SCORING.md`.

### Live development run (2026-10-13, threshold 0.9, development figures)

Command: `python -m backend.evaluate_decisions --systems selective jev --split dev --allow-api --gemini-pairs 8`

One Jev pass serves both views. `--gemini-pairs N` picks N pairs at random and allows one Gemini request for
each; every other pair is scored Jev-only. Gemini answered 6 requests, then returned 503 "high demand"; the
harness kept the Jev results and finished without escalation. Usage: about 385 Jev requests (including a 3-request
connectivity check), roughly 355,000 tokens, 7 Gemini requests.

| View | Criteria | Decided | Agree with experts | False inclusions | False exclusions | Abstained though experts decided |
|---|---|---|---|---|---|---|
| Rules + Jev, no escalation (50 pairs) | 504 | 48 (21 rule, 27 Jev) | 48 | 0 | 0 | 319 |
| Rules + Jev + Gemini (6 pairs) | 84 | 17 (4 rule, 3 Jev, 10 Gemini) | 17 | 0 | 0 | 46 |

95% intervals for "agree when decided": 92.6–100% (48 decisions) and 81.6–100% (17 decisions).

What this run shows:

- **The gates did the work, not Jev's raw answer.** Before any gate, Jev's choice matched the experts on 172 of 370
  criteria (46%). Seven of its raw Met / Not Met choices contradicted the experts, five of them in the
  false-inclusion direction. The threshold or the contradiction check blocked all seven.
- **Jev's confidence is not calibrated against these labels.** Expected calibration error 0.34. At confidence 0.95
  and above its raw choice matched the experts 55% of the time. The 0.9 threshold must not be read as "90% right".
- **Most of that gap is a labelling convention, and it should not be tuned away.** In 154 cases Jev said
  "unknown" where the experts said "not met"; 148 are exclusion criteria. The physicians marked an exclusion as
  "not excluded" when the short vignette did not mention it. Our prompt says missing information is unknown.
  Teaching Jev the experts' convention would raise every score here and would be a false-inclusion habit on real,
  incomplete records.
- **Coverage is low.** The layer decided 9.5% of criteria without Gemini and 20% with it. It was right when it
  spoke, and silent most of the time.
- **Numeric and date criteria:** Jev accepted a decision on 4 of them, all matching the experts. That is far too
  few to say they are safe with Jev.
- **Escalation demand:** of 483 criteria the rules left open, 169 were low-confidence, 91 high-risk, 22 ambiguous
  and 22 had an uncertain evidence pick. That is 63% wanting Gemini, which is why the request budget matters.
- **Speed:** Jev took a median 0.35 s per criterion (95th percentile 0.48 s). A Gemini request took 8–28 s.

### Held-out run (2026-10-14, threshold 0.9, run once)

Command: `python -m backend.evaluate_decisions --systems selective jev --split held_out --allow-api --gemini-pairs 8`
(the dev settings, unchanged). Before it ran: 28 held-out patients, 25 dev, none in both; dataset checksum matched;
no earlier Jev or Gemini output for this split existed. Results: `data/eval/decisions-held_out-20261014T153232Z.json`
(labels and telemetry only, no note text).

Gemini returned 503 "high demand" on its first request, so **no pair got Gemini** and the selective view is empty.
Only the rules + Jev layer was measured on held-out data.

| View | Criteria | Decided | Agree with experts | False inclusions | False exclusions | Decided where experts said unknown | Abstained though experts decided |
|---|---|---|---|---|---|---|---|
| Rules + Jev, no escalation (55 pairs) | 489 | 52 (21 rule, 31 Jev) | 50 | 0 | 1 | 1 | 282 |

- Agreement when decided: 96.2%, 95% interval 87.0–98.9%. Coverage 10.6%.
- **Both errors are Jev's, both at confidence 0.96, neither numeric.** An exclusion was called Met (patient
  excluded) where the experts said not met: a false exclusion. An inclusion was called Met where the experts said
  there was not enough information. The metric does not count that as a false inclusion, but it favours the
  patient on missing evidence, which is the error the gates exist to stop. The rules made no errors (21 of 21).
- Numeric and date criteria: 147; 19 decided (11 rule, 8 Jev), all agreeing with the experts.
- Calibration: expected calibration error 0.28, Brier 0.32. At raw confidence ≥ 0.9 Jev's choice matched the
  experts 66% of the time (51% of criteria reached that confidence). As on dev, 0.9 does not mean "90% right".
- Escalation demand: of 468 criteria the rules left open, 310 (66%) wanted Gemini: 174 low-confidence,
  77 high-risk, 37 ambiguous, 22 uncertain evidence.
- Operations: 354 Jev requests, about 360,000 tokens; median 0.34 s per criterion (95th percentile 0.47 s).
- Dev showed no errors in 48 decisions; held-out shows 2 in 52. The held-out figure is the estimate to quote.

### Why these numbers must not be read as reliability

- The patients are fictional vignettes of 2–13 sentences. Finding the deciding sentence is easy there and hard in a real chart.
- "Zero false inclusions" rests on 48 and 17 decisions. The intervals above are the honest statement.
- The dev split has only 6 exclusion criteria the experts called "excluded", so the dangerous error had almost no chance to occur.
- These are development figures from one run. Nothing was tuned on them yet; if anything is, they stop being a fair estimate.
- High agreement on this set would show that the layer handles short, tidy, synthetic notes. It would not show
  that it is safe on real oncology patients.

### Running the paid systems

```
python -m backend.evaluate_decisions --systems selective jev --split dev --allow-api --gemini-pairs 8 \
    --jev-usd-per-mtok <price> --gemini-usd-per-mtok <price>
```

Unbudgeted volume for `selective`: dev about 382 Jev requests and, once low-confidence escalations are counted,
a Gemini request for nearly every pair; held-out about 353 Jev requests and likewise. Jev's price is listed by
third parties at roughly $0.04 per million input tokens; that is unverified, so prices are passed in, not built in.

The notes are synthetic case descriptions, so this run sends no real patient data. The same is true of the
workbench's synthetic patients. It would not be true of n2c2 or any real record.

## Limitations to keep attached to any result

- TrialGPT patients are synthetic and short (2–13 sentences). Real records are longer, messier and incomplete.
- Its labels are a consensus formed while looking at GPT-4's answer. A judge that resembles GPT-4 may be flattered.
- Its trials span general medicine. Our index is oncology.
- Only 10 "excluded" and 23 "not included" labels exist, so false-inclusion estimates will have wide uncertainty.
- 53 patients cannot support subgroup analysis.
- CHIA and LCT measure reading of criteria text, never eligibility.
- Gemini token counts are estimated from characters, because the existing judge does not return usage.
- Jev request and token totals count scored criteria only; requests for "not applicable" rows add about 3%.
- Jev's vendor-reported accuracy and calibration have not been reproduced here.

## What still needs clinician-labelled cases

1. Met / Not Met / Unknown accuracy on **real oncology patients**, labelled blind to any model output.
2. False-inclusion and false-exclusion rates with enough "excluded" and "not included" cases to be meaningful.
3. Whether a Jev confidence of 0.9 corresponds to an acceptable error rate on this task, and what threshold does.
   On the synthetic set its confidence did not track agreement with the experts.
4. Whether numeric and date criteria are safe to leave with Jev. They were moved there by request; no data yet says how it performs on them.
5. Whether the high-risk keyword list matches what clinicians consider high-risk. It is ours and unreviewed.
6. Evidence correctness on real records, and abstention quality where records are incomplete.
7. Performance by cancer type, stage, biomarker, age, sex and missing data.
8. Agreement between clinicians, which sets the ceiling for any judge.

The workbench's "Download for clinician adjudication" export is the starting point. A first useful set is
100–200 criteria across at least 20 patient–trial pairs, double-labelled, with labels entered before the
reviewer sees a model's answer.
