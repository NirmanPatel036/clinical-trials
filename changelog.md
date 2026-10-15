# Changelog

Step-by-step record of the rebuild guided by `restructure.pdf`. Newest steps are at the bottom.
Open work is tracked in `backend/TASKS.md`; evaluation detail is in `backend/EVALUATION.md`; scoring rules in `backend/SCORING.md`.

## 2026-10-12

### 1. Audit and plan (no code)
- Read the original repository (`src/`, Modal scripts, Next.js frontend) against `restructure.pdf`.
- Confirmed the PDF's P0 defects in code and data: filter values that never matched the index, substring parsing
  ("treat**men**t" as male, every stage as "early"), swallowed Chroma errors, patients and trials ranked together,
  a 999-year minimum age on 52 trials, 85 duplicate trials, a weekly job that never re-embedded.
- Agreed a phased plan and that all new work goes in `backend/`, leaving the old code untouched.

### 2. New backend: data model and retrieval
- `schema.py`: status, phase and sex enums; `TrialRecord`; `QueryPlan`; answer schema.
- `ingest.py`: ClinicalTrials.gov API v2 with a real status filter and `nextPageToken`; immutable raw snapshots;
  normalisation; de-duplication; counts for a manifest.
- `query_plan.py`: token-based parsing of NCT IDs, phase, status, age, sex, stage, biomarkers and location.
  Ambiguous wording ("active") is reported, not guessed.
- `index.py`: section chunks with factual headers; Chroma (PubMedBERT) plus BM25; versioned index directories;
  an `ACTIVE` pointer switched only after checks pass; stale-index detection.
- `retrieve.py`: hard filters before ranking, reciprocal-rank fusion, one result per trial, optional reranker.
  An impossible filter returns nothing; there is no unfiltered fallback.
- `answer.py`: Gemini structured output; citations and quotes are dropped unless found in the retrieved evidence.
- `build.py`: fetch, normalise, index, smoke-check, activate.
- Built the first real index: 2,000 studies fetched, 1,788 unique trials, 10,676 chunks, 14 of 14 checks passed.
- `streamlit_app.py`: workbench with query plan, retrieval trace, evidence, answer, evaluation and system tabs.

### 3. Patient matching
- `match.py`: minimal patient facts (no name, birth date or address); access check with an audit log; rules for
  registry age and sex and plain ECOG bounds; Met / Not Met / Unknown per criterion with evidence; three overall
  labels that all end in "review required".
- Optional Gemini judge that is accepted only with a verbatim fact line.
- Fixed two faults found on the first live Gemini call: the client was closed before the request, and the model
  name `gemini-2.5-flash` had been retired (now `gemini-3.8-flash`).
- Patient match tab in the workbench, with a clinician adjudication export.

### 4. Selective decision layer and first evaluation harness
- `decide.py`: rules first, then TypeSafe's Jev for bounded decisions, then Gemini for high-risk, ambiguous or
  low-confidence criteria. A Jev decision needs confidence at or above a threshold (default 0.9) and evidence the
  existing validator accepts. Missing or contradictory evidence returns Unknown. Decision log holds no patient data.
- `evaluate.py`: criterion extraction and interpretation against the CHIA and Leaf Clinical Trials corpora (both
  CC BY 4.0, downloaded and checksum-verified). Paid judges refuse to run without `--allow-api`.

## 2026-10-13

### 5. Routing change, age fix, decision evaluation
- Numeric and date criteria now go to Jev under the same gates, at the owner's request.
- Replaced the loose age keyword match with `age_bounds`, which parses the range from the criterion. "Gestational
  age", "age-related macular degeneration", "bone age" and consent clauses no longer match. A criterion that asks
  for more than an age is not called met on age alone.
- Investigated n2c2 2018 (restricted, not obtained), TrialMatchAI (synthetic profiles only) and the real-world
  cohorts in the literature (not released).
- `evaluate_decisions.py`: Met / Not Met / Unknown scoring against TrialGPT's physician criterion annotations
  (public, 53 synthetic patients), with a patient-level development / held-out split, false inclusions and false
  exclusions counted separately, abstention, calibration, escalation, latency and cost.

### 6. First live Jev run (development split only)
- Added a Gemini request budget (`--gemini-pairs`) and scoring of the Jev-only and Jev-plus-Gemini views from one
  Jev pass. A Gemini failure no longer loses the Jev results.
- Result: 48 of 504 criteria decided without Gemini, all agreeing with the physicians; no false inclusions or
  exclusions. Jev's raw confidence did not track agreement, and most disagreement came from the dataset treating
  an unmentioned exclusion as "not excluded". Nothing was tuned on this. Held-out split not yet run for Jev.

### 7. Comparison with TrialGPT and CriteriaMapper (no code)
- Identified four things to borrow: a trial-level score, a "not applicable" outcome, structured lab comparison
  and field-weighted BM25.

### 8. Score, Not Applicable, labs, BM25 experiment
- Trial score: share of applicable criteria satisfied; unknown never counts; any blocking criterion cuts it to a fifth.
- `not_applicable` outcome, set by rule only when a line speaks solely to the other sex; judges may return it with evidence.
- `labs.py`: lab results with unit, date and source; deterministic comparison for single-threshold criteria with
  unit conversion and a freshness limit. A stale or unconvertible result is a rule-level unknown that no judge may fill.
- Weighted BM25 and `bm25_experiment.py`. Differences were within noise on a proxy test, so the default is unchanged.
- `SCORING.md` documents all of this.

### 9. Housekeeping
- Task tracker (`backend/TASKS.md`) shown above the query box in the workbench.
- Moved the old `frontend/` contents and six root scripts to the Trash: `modal_app.py`, `modal_config.py`,
  `modal_update_trials.py`, `modal_upload_data.py`, `verify_setup.py`, `test_api.py`.

### 10. Changelog and data clean-up
- Started this changelog; it is updated with every further change.
- Moved everything the backend no longer reads out of `data/` to the Trash: the old trial JSON files, the old
  Chroma index and its spreadsheet export, and the 80 raw FHIR bundles. `data/patients/processed/patients.json`
  (the synthetic patients) is the only file left. The old `src/` pipeline and `gradio.py` can no longer run.

### 11. API with real authentication (`backend/api.py`)
- `GET /health` and `GET /api/stats`: index version, registry data timestamp, snapshot age, build status, counts.
  No token needed.
- `POST /api/search`: the same query plan, hard filters and hybrid retrieval as the workbench.
- `POST /api/match`: scored criterion findings for one patient.
- Every `/api` route except stats needs a Supabase access token. It is verified with `SUPABASE_JWT_SECRET`
  (HS256) or, without one, against the signing keys published at `SUPABASE_URL`. With neither set, protected
  routes answer 503, not open access.
- A user may match only patients listed in their token's `app_metadata.patient_ids`, which only the Supabase
  service role can write. Denials are written to the audit log.
- Jev and Gemini judging through the API is off unless the deployment sets `NEXTRIAL_ALLOW_PAID_JUDGES=1`.
- Checked live on this machine against the real index with a locally signed token: search and match worked, a
  missing token got 401, another patient got 403, and the judge got 403 without the opt-in.
- Not included yet: rate limiting, the answer endpoint, deployment.

### 12. Dependencies
- `backend/requirements.txt`: fifteen direct dependencies, pinned.
- A clean install caught a real conflict that the working machine hid: Streamlit 1.52 does not accept pandas 3.
  pandas is now held below 3.
- `backend/requirements.lock`: the full freeze (130 packages) from a clean Python 3.11 environment, in which all 252
  tests pass. The clean install resolved pandas 2.3.3 and a newer torch than this machine has.

### 13. Safety tests (`backend/tests/test_safety.py`)
- Prompt injection: an instruction planted in a criterion, in registry text or in a search query cannot produce
  a decision, add a citation or switch off a filter. Each case is a test.
- Free-text patient notes that read like instructions ("ignore the criteria", "the patient is eligible") are now
  hidden from the judges and cannot be cited as evidence. This is a keyword screen and stops crude attempts only.
  It removed none of the 274 note sentences in the evaluation set.
- Cross-patient leakage: with two patients loaded, one patient's facts never appear in the other's API response,
  in requests sent to Jev, or in the audit and decision logs. The trial index holds no patient data.
- Tool failure: if Jev fails or returns a malformed reply, the API answers 502 with no result, never a
  half-judged one. A retrieval failure is an error, not an empty answer.
- 252 tests pass, all offline.

### 14. Supabase wiring and old deployment shut down
- `SUPABASE_URL` added to `.env`. The project publishes an ES256 signing key, so the API verifies sign-in tokens
  against it and needs no shared secret. Confirmed against the live project: the key is fetched, and a missing
  token, a forged token and the public anon key are all rejected. A real signed-in user's token has not been tried.
- No Supabase reset: the new backend needs no tables. Accounts come from Supabase Auth and patient grants from
  each user's `app_metadata`. The old tables (`patient_profiles`, `saved_trials`, `conversations`, `messages`)
  are unused and left as they are.
- Stopped the old `clinical-trial-api` Modal app; its URL now returns 404 and its Sunday job no longer runs.
  `clinical-trial-api-update` and the `clinical-trial-data` volume were left in place.

### 15. Rest of the old Modal deployment removed
- Stopped `clinical-trial-api-update` and deleted the `clinical-trial-data` volume, which held the old trial JSON
  files, the old embeddings and the synthetic patient files. Nothing of the old system is deployed on Modal now.
- The `google-api-key` Modal secret was left in place; the new API will need a Google key when it is deployed.

## 2026-10-14

### 16. Entry and workbench polish
- Sign-up artwork now stays fixed while the form scrolls: an inline `position:relative` was overriding the
  `.entry-art` sticky rule.
- Removed the "Trial discovery aid only…" strip from the top of the workbench.
- The "API unavailable" / "Index unavailable" card is centred.
- `frontend/.env.local` points at the local API (`http://localhost:8000`); the old Modal URL is gone.

### 17. Supabase reset and profiles schema (`supabase/schema.sql`)
- Dropped the old `public` schema: `patient_profiles`, `saved_trials`, `conversations`, `messages`, their functions,
  and the old `on_auth_user_created` trigger. All auth users had already been deleted from the dashboard.
- New `public.profiles`: one row per account with the sign-up fields, checked against the form's choices.
  Blank fields are stored as null ("not recorded").
- Trigger `on_auth_user_saved` copies `user_metadata.profile` into the table on sign-up and on every profile edit,
  so the frontend is unchanged. Row-level security lets a user read only their own row; nobody writes to it directly.
- Verified with a test user inserted and updated inside a rolled-back transaction.
- Name, birth year, sex and diagnosis are now `not null` in `public.profiles`. An account without them is refused
  at creation (including the dashboard's "Add user"), and a profile edit that blanks one is refused too.

### 18. Passwordless login
- Sign-in emails a one-time code (`signInWithOtp`, `shouldCreateUser: false`) and verifies it with `verifyOtp`;
  the password field and "Forgot password?" link are gone from the login page.
- Email template in `supabase/templates/magic_link.html`; it goes in Supabase Auth → Email Templates → Magic Link.
- Sign-up is passwordless too: the profile goes with `signInWithOtp` and the account exists once the code is
  verified. The forgot-password and reset-password pages are removed.
- Supabase's "Confirm signup" template must show `{{ .Token }}` as well, since a first sign-in confirms the email.

### 19. Two-factor sign-in and the profile moved out of the token
- Every sign-in is now email code plus an authenticator app (Supabase TOTP MFA). `/mfa` sets one up on first
  sign-in and asks for a code after that; `/mfa?add=1` (linked from the profile page) adds a backup device.
  Recovery when every device is lost is an admin removing the factor in the dashboard.
- `public.profiles` is now the only copy of the profile. Sign-up still sends it as user metadata; an insert trigger
  copies it into the table and strips it from the metadata, so health details never ride in an access token.
- Row-level security: a user reads and edits only their own row, and only from an aal2 (two-factor) session.
  No insert or delete from the client. Checked with simulated aal1, aal2, other-user and anon sessions.
- The API refuses tokens that are not aal2 (`current_user` in `backend/api.py`); 254 tests pass.
- The workbench and profile page send aal1 sessions to `/mfa` before loading anything.
- New emails get Supabase's "Confirm signup" template, not "Magic Link": its code version is
  `supabase/templates/confirm_signup.html`.

### 20. Index load race, passkeys, code boxes
- `/health` and `/api/stats` arrive together on page load; both found the `lru_cache` empty and opened Chroma at
  once, which crashes Chroma's client setup (500s, "Could not connect to tenant default_tenant"). Index and
  embedder loading now share a lock. Test: concurrent first requests load the index once. 255 tests pass.
- `/mfa` set up the authenticator twice in dev (effects run twice), and the second enrolment failed with Supabase's
  "Unexpected error occurred". It now runs once per visit, with a unique factor name.
- Codes are entered in six boxes (`components/CodeInput.tsx`): typing advances, Backspace goes back, paste and
  SMS/email autofill fill all six. Used for the email code and the authenticator code.
- Passkeys: "Sign in with a passkey" on the login page replaces the email code; the authenticator step still
  follows. Passkeys are added from the profile page, which only a two-factor session can reach.

### 21. Display name restored in Supabase Auth
- Step 19's sign-up trigger stripped the name from user metadata along with the profile, so the dashboard's users
  list showed no display name. The trigger now keeps the name as `full_name` and `display_name`; everything else
  in the profile still leaves the metadata. A rename on the profile page is copied back by a trigger on `profiles`.

### 22. Auth emails through Resend (Send Email hook)
- `supabase/functions/send-email`: Supabase Auth calls this Edge Function instead of its own mailer. It checks
  the hook signature, picks the template by `email_action_type` (`signup` → verification code, `magiclink` →
  sign-in code), escapes the values it fills in, and sends through Resend's API. Any other email type, a forged
  signature or a Resend failure returns an error, so Auth reports it instead of silently sending nothing.
- The two templates moved into `templates.ts`; the dashboard templates and `supabase/templates/` are no longer used.
- Secrets: `RESEND_API_KEY`, `SEND_EMAIL_HOOK_SECRET`, `EMAIL_FROM` (sender on the verified domain
  `diploscribe.me`). Tests: `deno test --allow-env supabase/functions/send-email`.
- Deployed `send-email` (`--no-verify-jwt`; the hook signature is the guard) and set its three secrets. Checked
  live: an unsigned call gets 401, a correctly signed call of an unused type gets 400, so the secret matches.
  Sender is `"Anvi @ Orvant" <no-reply@diploscribe.me>` (display name quoted because it contains "@").
- Sender showed as `\"Anvi @ Orvant\"`: `secrets set --env-file` kept the escaping backslashes. Re-set as a plain
  argument; the stored value's SHA-256 matches `"Anvi @ Orvant" <no-reply@diploscribe.me>`.
- Email OTP length set to 6 (`mailer_otp_length`, was 8) through the Management API, to match the six code boxes.

### 23. Workbench redesigned for non-technical users
- Sidebar with tabs instead of one long page: Find trials, My profile, Patient match (only with granted records),
  How we searched (query plan, retrieval trace), About the data (index stats, retrieval comparison). The open tab
  is kept in the URL hash. On narrow screens the sidebar becomes a top bar.
- Find trials: one plain-language box (Enter searches), "Use my profile", a collapsible Filters panel (phase, sex,
  age, location, how many) and example prompts. Status and retrieval-mode controls are gone from the UI: the
  snapshot holds recruiting trials only and searches always run hybrid (the comparison stays under About the data).
- While a search runs, a thinking card steps through what is happening, with placeholder cards below.
- Trial cards: rank, status and phase pills, title, NCT ID and last update date, a "Why this trial came up"
  passage with the searched words highlighted, more passages on demand, and a ClinicalTrials.gov button.
  Result header says how many were found and what was understood, in plain words.
- Removed: the answer-generation card, the snapshot/index line in the nav, and the logo and rule line from
  section and card headings.

### 24. Code boxes, pagination, profile in the search box, fingerprint passkeys
- Code boxes now advance as you type. Focus was moved before React re-rendered, so the next box's focus handler
  saw the old value and sent focus back; focus now moves after the render.
- "How many trials" filter removed. Every search asks for 30 (the API maximum) and results show 5 per page with
  Previous / page numbers / Next.
- "Use my profile" fills the search box with the whole profile except email, as an editable sentence the parser
  reads ("46 year old female, … in Austin, Texas, United States"). It no longer runs the search by itself.
  Disease status "active" is written "ongoing disease", since "active" alone is read as a trial status.
- Passkeys prefer the device's own sensor (Touch ID, Windows Hello, Android biometrics): registration asks for a
  platform authenticator with user verification (`lib/passkey.ts`), falling back to `registerPasskey` on browsers
  without the WebAuthn JSON helpers. After a full sign-in, a device with a sensor and an account with no passkey
  gets a "Sign in with your fingerprint next time" prompt ("Not now" is remembered per device). A failed passkey
  login points to the email code, after which setup is offered.

### 25. Sidebar polish and sign-out confirmation
- The selected sidebar tab no longer has the blue bar on its left edge; the tinted background marks it.
- The sidebar collapses to icons (button beside the wordmark; tab names become tooltips), remembered per device.
  On narrow screens the top bar always shows labels and the button is hidden.
- Sign out asks first, in a native `<dialog>` (Esc or Cancel closes it). Automatic sign-outs on an expired
  session do not ask.
- Collapsed sidebar shows the Orvant mark (`orvant-mark-light.png`, links home) with the expand button below it.

### 26. Ask (RAG chat) and saved trials
- `POST /api/chat`: takes the conversation (up to 20 turns, last one the user's question), retrieves the 6 closest
  trials for the question (hybrid search, same parser as Find trials), and has Gemini answer from their registry
  text only. `generate_answer` now takes the earlier turns and cites inline as `[NCT…]`; the existing citation check
  still runs. Reply: answer, the 6 sources (title, status, phases, link, the quotes Gemini used) and limitations.
  No matching trial means a plain reply and no model call; a model failure is a 502 and nothing is saved.
- Workbench "Ask" tab: empty state with a greeting, the composer, four example questions and recent conversations.
  Answers show numbered source cards above the text and citation chips in it; hovering a chip lights up its card
  and the other way round. Sources the answer didn't cite are dimmed. History (native `<dialog>`), New chat, delete.
- Follow-ups go to Gemini with the last 10 turns, but retrieval reads only the latest question (marked `ponytail:`
  in `api.py`); "and in Texas?" searches without the earlier topic.
- Supabase: `conversations`, `messages` (role, content, sources, limitations as JSON) and `saved_trials`
  (user, NCT ID, title, link). Owner-only RLS gated on aal2, like `profiles`; insert grants only on the columns the
  client sets. A new message bumps its conversation's `updated_at`. Applied to the live project through the
  Management API (only the new block; `schema.sql` as a whole wipes `public`). Checked live: owner reads, an aal1
  session sees nothing, another user can neither read nor write into the conversation.
- Find trials: a Save / Saved bookmark on each trial card, applied at once and undone if the database refuses.
  New "Saved trials" tab lists them with the registry link and Remove.
- Tests: 256 passing (new: chat route, with the model mocked). Checked live against Gemini: inline citations,
  quotes and history-aware follow-ups. Gemini returned 503 "high demand" on 2 of 5 calls during testing.

### 27. Four answer models in Ask
- Ask can answer with Gemini, Groq (`GROQ_MODEL`), Hugging Face (`HF_MODEL`) or OpenRouter (`OPENROUTER_MODEL`).
  The last three go through their OpenAI-compatible chat endpoints (`answer.answer_with`). Comma-separated keys in
  `GROQ_API_KEYS` / `HF_API_KEYS` / `OPENROUTER_API_KEY` are tried in turn; 401/402/403/429 moves to the next key.
  Keys copied from `ref.txt` into `.env` (both gitignored).
- `/api/chat` takes `provider` (default `gemini`) and returns `model` ("provider:model"); `/api/stats` lists
  `chat_models`, null for a provider with no key. Messages store `model` (new column, applied live).
- Models without Gemini's enforced schema are asked for JSON; JSON wrapped in prose or code fences is accepted,
  and plain text is shown with a note that its citations couldn't be checked.
- Citation check, all models: Unicode dashes count as "-", and an elided quote ("a ... b") passes when every piece
  is in the evidence. gpt-oss went from 2/10 to 10/10 quotes kept.
- Composer: model dropdown with each provider's logo (LobeHub icon set; Groq and OpenRouter glyphs given brand
  colours), the model ID, and "Not set up" for providers without a key; the pick is remembered per device. Each
  answer says which model wrote it. Bare NCT IDs in an answer link to and light up their source card.
- Checked live: Groq and OpenRouter answer with citations. Hugging Face: all 9 keys return 402 "no remaining
  credits", shown in the chat as such.
- Model dropdown showed "…" instead of a model ID until `/api/stats` answered with `chat_models` (or when the page
  was opened before the API had them). Each provider now has a built-in default ID, replaced by the server's.

### 28. Workbench routes, standalone sidebar, chat polish
- Each sidebar tab is its own route: `/workbench/search`, `/ask`, `/saved`, `/profile`, `/match`, `/details`,
  `/data`; `/workbench` redirects to Find trials (307 from `next.config.ts`). `app/workbench/layout.tsx` keeps the
  session, profile, stats, saved trials, the last search and the open Ask conversation across routes
  (`components/workbench/context.tsx`), so "How we searched" still shows the last search and Ask reopens its
  conversation. Old `#tab` links land on Find trials; the profile editor now returns to `/workbench/profile`.
- `components/workbench/Sidebar.tsx`: brand, links (current one from the path), collapse button, account and the
  sign-out dialog.
- Ask: a new question scrolls to the top of the view with room below for the answer. The thinking line cycles
  through sentences, each word flipping out in turn as the next sentence flips in (`FlipText`, also used by the
  Find trials thinking card; off under reduced motion). Three example questions instead of four. "What this answer
  doesn't cover" opens with a chevron that turns down.
- Answers: the prompt asks for 1–2 direct sentences, at most 5 short bullets, under 180 words, no headings, tables,
  preamble or closing offers. `lib/tidy.ts` cleans up what models still send: headings, tables, numbered lists,
  run-on bullets, "(NCT…)" and "[ NCT… ]" citations, "Sure!" openers and "hope this helps" closers. Answers over
  900 characters fold behind "Show full answer". Check: `node lib/tidy.check.ts`.

### 29. Held-out Jev run, Jev in Match, knowledge in Ask, one start-up call
- Held-out decision evaluation run once with the dev settings, after checking the split (28 / 25 patients, none in
  both; checksum matched; no earlier Jev output). Rules + Jev decided 52 of 489 criteria and agreed with the
  physicians on 50: one false exclusion and one inclusion called met where the experts said "not enough
  information", both by Jev at 0.96. No false inclusions. Gemini answered 503 on its first request, so escalation
  was not measured. Details in `backend/EVALUATION.md`.
- Match: `/api/stats` now says whether paid judges are on (`paid_judges`, no key values). When they are off,
  Match shows "Rules only" with the reason instead of offering the selective judge and failing with a 403.
  The gate itself is unchanged: `NEXTRIAL_ALLOW_PAID_JUDGES=1` plus a TypeSafe key, and grants in `app_metadata`.
- Ask, PubMed (`backend/knowledge.py`, NCBI E-utilities): a "PubMed on/off" chip in the composer, remembered per
  device; questions about papers or literature search it anyway. Only topic words are sent: ages, known places,
  pronouns, sex words, emails and long numbers are removed first. Up to 4 abstracts go to the model as "Published
  research", cited [PMID:…], quoted in `literature_spans` and checked like registry quotes. Shown as their own
  "Published research · PubMed" cards, apart from the trial sources.
- Ask, ICD-10-CM (NLM Clinical Tables): looked up only when the question asks for an ICD or diagnosis code, using
  the parsed condition. Shown as a code list; the model may name only listed codes and is told not to pick one.
- Ask, RxNorm (NLM RxNav): needed after all. "after Tagrisso" found 0 of 6 osimertinib trials, "after osimertinib"
  6 of 6. Brand names right after prior-therapy wording are looked up and their generic names added to the chat's
  trial search; the reply says "Also searched for osimertinib (Tagrisso)". Matching does not use it.
- Any lookup failure becomes a limitation line, never a failed answer. PubMed and ICD run alongside retrieval.
  None of these lookups is used by `/api/match` (test). NLM attribution line shown when NLM data is used.
- Articles, codes and drug expansions are saved inside the existing `messages.sources` JSON, tagged by kind, so no
  database change was needed.
- `/health` was called on every workbench load next to `/api/stats`, which returns the same freshness fields
  (twice each in dev, where React runs effects twice). The workbench now calls `/api/stats` only. `/health` stays
  for monitoring.
- ICD-11 and SNOMED CT deferred (market and licensing). Tests: 268 backend passing (11 new), `tsc` clean,
  `node lib/tidy.check.ts` passing.
- `knowledge.py` docstring corrected: RxNorm names do widen the chat's trial search; matching and scoring still use none of it.
- Ask's PubMed control is now a switch (track and sliding thumb, `role="switch"`), not an on/off chip.

### 30. Match escalates to Groq instead of Gemini
- In `/api/match`, criteria Jev should not decide (high-risk, ambiguous, low confidence, uncertain evidence) now go
  to Groq (`GROQ_MODEL`, keys from `GROQ_API_KEYS`, tried in turn) instead of Gemini. The gates are unchanged:
  a verbatim fact line is required, Jev and Groq pointing opposite ways stays unknown, and an unparseable Groq
  reply is a 502 with no partial result. Without a Groq key the escalated criteria stay unknown with a note.
- `decide()` takes the judge as `judge_key` / `judge_provider`; `judge_with_llm()` speaks to Gemini (enforced
  schema) or any OpenAI-compatible provider (asked for a JSON array). `answer.openai_chat()` is the shared
  key-rotating call, also used by chat.
- `/api/stats` `judge_model` reports the Groq model. Match labels, the consent line and the landing sample now say Groq.
- Unchanged and still on Gemini: the Streamlit workbench and the evaluation harnesses. The held-out figures in
  `EVALUATION.md` were measured with Gemini as the escalation judge (which returned 503), not Groq.
- Tests: API tests no longer pick up the real Groq keys from `.env`; new tests for Groq escalation and a
  malformed Groq reply. 270 passing. Live check on one synthetic patient: Groq decided 2 of 8 open criteria in
  4.4 s, both with verbatim evidence.

### 31. Patient match: match yourself, or the synthetic demo patient
- `/api/match` takes either `patient_id` (synthetic) or `profile` (the signed-in user's own facts), never both.
  The profile carries age, sex, diagnosis, stage, disease status, biomarkers, ECOG, medications and procedures;
  name, birth year, email and place are rejected (422). Self matches need no grant and are audited as `self`.
- Every account may match one synthetic demo patient (`DEMO_PATIENT`, also in `/api/stats` as `demo_patient`);
  other synthetic records still need `app_metadata.patient_ids`. The Patient match tab is shown to everyone.
- Synthetic patients now show their made-up birth date ("Born 1965-06-13 (made up, shown only here)"). It is
  returned as `synthetic_birth_date`, never as a fact line, so judges never receive it. The "No name, birth date
  or address is loaded" line is gone.
- Match page: "Me (my profile)" / "Synthetic patient" choice; the Jev threshold slider is removed (the server's
  0.9 applies); choosing the selective judge lists, with checkmarks, what goes to TypeSafe and Groq, what is never
  sent and what is logged, and needs a tick before running. Intro text rewritten to match.
- Segmented controls no longer clip their corner options when they wrap (container radius 19px, not 999px).
- My profile text now points to Patient match for criterion-by-criterion checks.
- Tests: 278 passing (8 new: self match, one-patient rule, rejected identifiers, demo access, birth date kept out
  of fact lines). `tsc` clean.

### 32. Match results on their own page
- Results moved from the bottom of Patient match to `/workbench/match/results`. A successful run opens it; the
  form page keeps only the controls and any error (a denied or failed run stays on the form).
- The last result is kept in the workbench state (`match` in `components/workbench/context.tsx`), like the last
  search, so it survives switching tabs until the next run or sign-out.
- Sidebar: "Results" appears as an indented sub-item under Patient match once there is a result (or while on
  the page), and is the highlighted item there. Collapsed sidebar shows it as an icon.
- The results page has "Back to Patient match" at the top; opened with no result, it says so and links back.
- `tsc` clean; the dev server serves the new route.

### 33. Clearer judge labels in Match, and a "Stage details" profile field
- Each criterion now says who settled it, or why nobody did, in plain words: "Decided by rule", "Jev · self-
  reported confidence 0.96", "Groq", "Jev and Groq couldn't settle it", "Groq couldn't settle it" (Jev skipped),
  "Not settled" (Groq not set up) or "Not judged · rules only". The old "Not judged · abstained" was shown even
  when both judges had been asked.
- Internal codes are translated: `low_confidence` reads "Jev wasn't confident enough (below 0.9)", and so on for
  every `decision_note` in `decide.py`; a Groq decision says why Groq was asked. "no patient evidence" now reads
  "None of the facts settles this" for an unknown.
- Profile: new optional "Stage details" (TNM, grade, high-risk features, up to 200 characters). It becomes the fact
  line `stage_details: …`, so a judge can settle criteria like "Stage II (high-risk) or III" by quoting it; the
  rules still leave such criteria unknown. Sent to the judges with the other fact lines (the consent list says so).
- Database: `supabase/migrations/20261014_profile_stage_details.sql` adds the column, its update grant and the
  sign-up copy; `schema.sql` updated to match. **Not applied to the live project yet.** Until it is, profiles
  load (now read with `select *`, so a missing column is "not recorded") but saving the profile fails.
- Tests: 279 passing (stage details reach the fact lines; over-long details rejected). `tsc` clean.

### 34. Landing: "What Orvant is not" becomes a bento grid
- The Limits section (`#limits`) is now the Orvant Kit's card bento: 12 columns of white cards on the warm art
  background, one card per row below 860px (`landing.css`).
- Cards: "Not an eligibility decision" (dark lead card with the three "review required" labels), the score as a
  share of criteria, PubMed ("Kept apart from trial facts"), ICD-10-CM ("Listed, never picked for you"), RxNorm
  ("Brand names understood": Tagrisso → osimertinib), "Only topic words leave" (what an outside search receives),
  "Outside sources never touch a match", and a strip with the remaining limits.
- Two old limits were no longer true and are gone: "No literature search…" (Ask has PubMed now) and "Synthetic
  patients only" (users can match themselves; replaced by "Your facts, your tick").
- The `limits` list in `Landing.tsx` is removed; the copy lives in `LandingView.tsx`. `tsc` clean; the landing
  page serves with the new cards.

### 35. Landing bento: tighter layout, brand motion
- Removed the separate trial-score card (its point, "a share of criteria, not a probability", now sits in the
  lead card) and the four-item limits strip.
- New layout: dark "Not an eligibility decision" lead card + Patient match (row 1); PubMed, ICD-10-CM, RxNorm
  (row 2); a full-width "Only topic words leave" card (row 3).
- Patient match card redone as a mini criterion review (Met, Unknown, Met · blocking, N/A with the fact behind
  each) under the kit's blue scan line (`data-scan`).
- Motion from the brand kit: the Orvant mark spins slowly in the lead card (`data-spin`), the section's glows drift
  (`data-drift`), cards reveal on scroll. New loops in `landing.css`: the PubMed switch flicks on and its article
  slides in, ICD rows are highlighted in turn, the RxNorm arrow nudges, personal words in the sample question are
  struck out one after another, the review labels float. All off under reduced motion (shown in their end state).
- `tsc` clean; the landing page serves with the new cards.
- Landing "How it decides", card 02 (Judges): the spinning orbit is smaller (62% → 44% of the card width), with
  smaller dots (12px → 9px), a smaller centre mark (14% → 10%) and a tighter glow.

### 36. Match: one synthetic patient, shown by a short code
- The synthetic-patient dropdown is gone: there is one synthetic patient, shown read-only. "Demo patient" and the
  file id are no longer displayed; the patient appears as a short alphanumeric code derived from its id
  (`SP-C02FZC`), the same on the form, the results' facts card and the access-denied message.
- Removed the unused `patientIds` from the workbench layout and context. The API still accepts granted
  `patient_ids`; the frontend just no longer offers them. `tsc` clean.

### 37. Global loader
- `components/Loader.tsx`: the Orvant mark breathing inside a spinning blue ring, with green, amber and apricot
  status dots orbiting the other way; a mono caption ("LOADING…"). Still under reduced motion.
- `app/loading.tsx` shows it full-screen for any route until the page is ready; `app/workbench/loading.tsx` shows
  it in the content area so the sidebar stays during tab changes.
- The workbench (session, second factor and profile checks) and the profile editor show it until their data is
  in, instead of plain "Checking your session…" / "Loading your profile…" text; an error replaces it.
- `tsc` clean; the routes serve with the loader in their first HTML.

### 38. README rewritten, repository prepared for a clean push
- `README.md` replaced: what Orvant does and is not, architecture, repository layout, local setup (env variables,
  index build, Supabase, frontend), API routes, held-out evaluation figures, tests, data attribution, status. The
  old README's unbuilt features, MIT claim (no LICENSE file exists) and unmeasured metrics are gone.
- `.gitignore`: `backend/data/*` (raw snapshots, indexes, downloaded corpora, audit and decision logs) is now
  ignored except `backend/data/eval/`; also `.pytest_cache/` and `*.tsbuildinfo`.
- Checked before pushing: the project has no repository of its own (the git root is the home folder) and
  `frontend/` holds a separate create-next-app repository that would be pushed as an empty submodule link. The
  files a push would include (136, about 4 MB) contain no API keys or tokens.

### 39. "Ask AI" on trial cards
- Each Find trials card has an "Ask AI" button (chat icon) next to the ClinicalTrials.gov link. It opens Ask,
  starts a new chat and fills the box with "Tell me about NCT…: what does it test, who can join, and where is it
  recruiting?" without sending it. The NCT ID makes Ask's retrieval keep to that trial (hard filter).
- The question travels through the workbench state (`askDraft` in `context.tsx`); Ask takes it once and clears it,
  so returning to Ask later reopens the last conversation as before. `tsc` clean.

### 40. Social preview image
- `frontend/app/opengraph-image.png`: the Orvant logo card without the tagline, made from `frontend/assets/og.png`
  (1672×941), cropped to the 1.91:1 preview shape and resized to 1200×630, with an alt-text file. It is the only
  shared image: there is no separate Twitter image; Next.js points `twitter:image` at the Open Graph one and sets
  the large card (`summary_large_image`) by itself.
- "Ask AI" on trial cards now uses a blue sparkle icon (`ICON.sparkle` in `ui.tsx`) instead of the chat bubble.

### 41. Mobile pass
- Checked every page at phone size (390×844 and 360 wide, plus 768) in headless Chrome. The workbench was driven
  with a fake two-factor session and canned search, match and chat data from the local index; no Supabase or
  paid model calls. No page scrolls sideways.
- Landing: below 640px the nav keeps only the logo and "Open workbench" (the four section links wrapped into a
  tall bubble over the content). "How it works": closed panels are 34px tabs and the page padding 14px, so the
  open panel gets the width (it was squeezed to about 170px); its preview card starts lower so the text is not
  covered. Criterion rows put the INCLUSION/EXCLUSION tag above the text. Values are CSS variables in
  `landing.css`; desktop sizes are unchanged.
- Workbench: on short pages (Saved trials, How we searched) the top bar stretched to 186px; it now keeps its own
  height (`grid-template-rows: auto 1fr`). About the data: the three index numbers scale with the screen, so
  "10,676" no longer runs into the next figure.
- Already fine on phones and unchanged: sign-in, sign-up and profile forms, Find trials (cards, filters,
  pagination), Ask (composer, source, research and code cards), Match form and data-handling checklist, Match
  results (facts card, scores, criterion review).

## 2026-10-15

### 42. Data & Privacy section
- Four public pages under `/privacy`: Privacy policy, Data & security, Consent & preferences, Access & deletion
  (`frontend/app/privacy/`, shared pieces in `frontend/components/Privacy.tsx`, `.pv-*` styles in `globals.css`).
  Every statement was checked against the code; anything that depends on an undecided business or legal fact is an
  amber "TO BE CONFIRMED" placeholder. No compliance, encryption or retention claims.
- Working controls, only where the backend supports them: the PubMed switch (same device key Ask reads), clearing
  Orvant's own browser settings, downloading your profile, conversations and saved trials as JSON, and deleting all
  conversations or all saved trials (RLS-scoped, with confirmation). Account deletion stays a request.
- Links: landing footer, workbench sidebar (new tab, so the open search and match survive), sign-in and sign-up.
- `PRIVACY_PAGE_REVIEW.md`: verified claims, gaps, placeholders, tests and launch blockers.

### 43. Privacy pages: owner decisions in place of placeholders
- Every "TO BE CONFIRMED" box was replaced with the owner's decisions: Nirman Patel as the responsible person,
  nirman0511@gmail.com as the contact, hosting mainly on Google Cloud, no minimum age, a 30-day reply to requests,
  no selling or advertising use, and retention as long as the account exists. Encryption and compliance are still not
  claimed. The placeholder component and its CSS were removed. `PRIVACY_PAGE_REVIEW.md` section 4 lists the commitments
  these create.

### 44. Deployment readiness (backend)
- Startup preloads the active index and the embedding model and runs one warm-up encode, so the first user no longer
  waits about 10 s. `GET /ready` returns 200 only when the index, the model and the audit log are all usable, and 503
  with the reason otherwise. It retries a failed load on each call. `/health` is unchanged.
- Offline loading: the API defaults `HF_HUB_OFFLINE=1`, and `python -m backend.fetch_model` fills the cache at build
  time. The model's main revision ships only `pytorch_model.bin`, not safetensors, which corrects the deployment
  audit. `ORVANT_DATA_DIR` lets the versioned index live outside the repo.
- Audit and decision logs: `ORVANT_LOG_DIR` sends them to persistent storage, and `ORVANT_AUDIT_SINK=stdout` sends them
  to a log collector instead. On Cloud Run (`K_SERVICE` set) with neither set, the server is not ready rather than
  logging to a disk that disappears.
- `backend/requirements-api.txt`: the runtime-only subset (no Streamlit, pandas, pyarrow or pytest), with the
  CPU-torch install note. Matching behaviour is unchanged.
- `backend/tests/test_deploy.py`: 13 offline tests, including the real model loading from cache with sockets blocked.

### 45. Cloud Run hardening
- Tests are tracked again: `backend/tests/` was in `.gitignore` from the first commit, with no stated reason, and holds no secrets.
- Model weights are pinned: `EMBED_REVISION` (commit `96786c7…`) is used by fetch, build and serving, and new builds
  record it in the manifest as `embedding_model_revision`. Older manifests fall back to it. The current index's stored
  vectors match these weights (max abs diff 2.2e-6).
- `backend/requirements-api.txt` adds `torch==2.14.1+cpu`. `backend/requirements-api.lock` has 113 packages pinned with
  hashes for Linux x86_64 and no CUDA, with versions consistent with `requirements.lock`.
- `Dockerfile` (one worker, offline model, one baked index version, non-root, audit events on stdout),
  `.dockerignore` (an allowlist), `deploy/cloudrun.yaml` (0–3 instances, 2 vCPU / 2 GiB, startup probe on `/ready`,
  CPU boost) and `DEPLOY.md`.
- Audit logs on Cloud Run go to a dedicated Cloud Logging bucket kept for 365 days. Privacy pages updated: no earlier
  deletion of single entries, and 30-day Google Cloud request logs (time, page, IP address, browser).
- The amd64 BuildKit build passed the hashed install and `pip check` (image 1.0 GB). The container run was not measured:
  the host disk filled up during the build. 296 offline tests pass.

### 46. Deployed to Cloud Run
- New project `orvant-backend` with billing linked, a ₹450 (about $5) monthly budget alert, and only the needed APIs.
  A dedicated runtime service account can read four secrets: the Gemini, Groq, Hugging Face and OpenRouter keys.
  Audit and decision logs route to a 365-day bucket and are excluded from `_Default`.
- `.gcloudignore` (an allowlist, so the git-ignored index is uploaded) and `deploy/cloudbuild.yaml`: build on amd64,
  then a no-network check at 2 CPUs / 2 GiB (`/ready` in 15.5 s, peak 636 MB), then push.
- Service `orvant-backend` (asia-south1): 0–3 instances, 2 vCPU / 2 GiB, one worker, `/ready` startup probe, pinned by
  digest, public invoker. Data routes still require a two-factor token. Cold start on Cloud Run is about 36 s.
- During setup, API key values were printed into the session output by a faulty shell command. The owner chose to keep
  the existing keys.

### 47. CORS for the Vercel frontend
- `CORS_ORIGINS` on `orvant-backend` is now `https://orvant-trials.vercel.app` only (new revision `-00002-pzs`, 100% of
  traffic). Preflight from that origin is allowed; `localhost:3000` and other origins are refused. `deploy/cloudrun.yaml`
  matches. The build VM profile `orvant-amd64` and its data disk were deleted, freeing about 7.4 GB.
