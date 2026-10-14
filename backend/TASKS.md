Tracked against `restructure.pdf`. Updated 2026-10-14 (step 33).

**Next up**
- [ ] Run `supabase/migrations/20261014_profile_stage_details.sql` in the Supabase SQL editor (owner: Nirman)
- [x] Jev in Match: users match themselves or the demo patient; paid judges on in `.env` (2026-10-14)
- [ ] Decide whether self-matching with paid judges is allowed for real users before launch (owner: Nirman)
- [ ] Escalation judge on held-out (Jev run done 2026-10-14; Gemini 503; Match now uses Groq) — decide what to rerun
- [ ] Rotate the Google, NCBI, TypeSafe, Groq, Hugging Face and OpenRouter keys (owner: Nirman)

**Phase 0 — safe and correct**
- [x] Filter normalisation, stage and age parsing
- [x] Retrieval errors no longer swallowed; filters fail closed
- [x] Trial search separated from patient matching
- [x] Source URLs, update dates, index manifests
- [x] Schema-validated LLM output with citation checks
- [x] Atomic index rebuild with smoke checks (local; not yet scheduled)
- [x] Regression tests (279 passing)
- [x] One pinned dependency file (`backend/requirements.txt`); a pandas / Streamlit conflict found and fixed
- [ ] Credentials rotated
- [x] Lock file from a clean install (`backend/requirements.lock`, 252 tests passing there)

**Phase 1 — retrieval quality**
- [x] Canonical trial schema and section chunks with factual headers
- [x] BM25 + dense, rank fusion, de-duplication, optional reranker
- [x] Evidence panel in the workbench
- [ ] Held-out retrieval ablation (needs relevance-labelled queries; only a proxy experiment exists)

**Phase 2 — patient matching**
- [x] Criterion parser and Met / Not Met / Unknown / Not Applicable matcher
- [x] Missing-information list, trial score, structured labs
- [x] Selective Jev layer with LLM escalation (Groq in the API since 2026-10-14) and evidence validation
- [ ] Evaluate Groq as the escalation judge on dev (harness still uses Gemini)
- [x] Audit and decision logs without patient data
- [x] API authorisation: verified Supabase token, patient grants from `app_metadata` (workbench still uses demo grants)
- [x] Held-out Jev run on the TrialGPT set (52 of 489 decided, 50 agree, 1 false exclusion; 2026-10-14)
- [ ] Held-out Gemini escalation (503 on first request)
- [ ] Clinician adjudication set (export exists, no labels yet)
- [x] Safety tests: prompt injection, cross-patient leakage, tool failure
- [ ] Subgroup evaluation

**Phase 3 — productionise**
- [x] FastAPI: `/health`, `/api/stats`, `/api/search`, `/api/match`; model judges off unless the deployment opts in
- [x] `SUPABASE_URL` set; API verifies tokens against the project's ES256 signing key
- [x] Old `clinical-trial-api` Modal deployment stopped (2026-10-13)
- [x] `clinical-trial-api-update` stopped and the `clinical-trial-data` volume deleted (2026-10-13)
- [ ] Deploy the new API
- [ ] Rate limiting on the API
- [ ] Scheduled ingestion on Modal with rollback
- [x] Chat knowledge: PubMed, ICD-10-CM, RxNorm via direct NLM/NCBI APIs, kept out of matching (2026-10-14)
- [ ] Live ClinicalTrials.gov record check for top results
- [ ] ICD-11 / SNOMED CT (deferred: market and licensing)
- [ ] Observability: freshness, latency, errors, retrieval drift
- [x] Old frontend and old Modal scripts removed (2026-10-13)
- [x] New frontend against the new API (workbench routes, steps 23–28)
- [x] Ask tab: RAG chat over the index with inline citations; conversations saved in Supabase (2026-10-14)
- [x] Saved trials: bookmark from Find trials, own tab, `saved_trials` table (2026-10-14)
- [ ] Chat follow-ups: rewrite the retrieval query from history (retrieval reads only the latest question)
- [ ] Retry or fallback model for Gemini 503s in chat
- [x] Model choice in Ask: Gemini, Groq, Hugging Face, OpenRouter with key rotation (2026-10-14)
- [ ] Hugging Face keys have no credits left (402 on all 9); top up or drop the provider (owner: Nirman)
- [ ] Secret scanning
- [ ] SMART-on-FHIR, monitored pilot (after security and clinical validation)
