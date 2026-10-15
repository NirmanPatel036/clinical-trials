# Data & Privacy section: review

Written 2026-10-15 against commit `4a941d9` plus this change. **Not legal review.** The pages describe what the code
does. Business facts and decisions come from the owner, Nirman Patel (contact nirman0511@gmail.com), on 2026-10-15
(section 4). No placeholders remain on the pages.

Note: `FRONTEND_BLUEPRINT.md` (2026-10-13) predates the FastAPI layer and Supabase auth. Where it disagrees with the
code (for example "there is no authentication"), the code was used.

---

## 1. Pages and components

| Route | File | Kind |
|---|---|---|
| `/privacy` | `frontend/app/privacy/page.tsx` | Privacy policy (static) |
| `/privacy/security` | `frontend/app/privacy/security/page.tsx` | Data & security (static) |
| `/privacy/preferences` | `frontend/app/privacy/preferences/page.tsx` | Consent & preferences (static page + interactive device settings) |
| `/privacy/requests` | `frontend/app/privacy/requests/page.tsx` | Access & deletion (static page + interactive account panel) |
| layout | `frontend/app/privacy/layout.tsx` | Public shell: wordmark, "Open workbench", last-updated date (`LAST_UPDATED`), section tabs, disclaimer footer |

`frontend/components/Privacy.tsx` (client module):
- `PrivacyNav`: section tabs with `aria-current`; scrolls sideways on phones and keeps the current tab in view.
- `Title`, `Section`, `Rows` (a `<dl>` that stacks below 640px), `Contact` (a mailto link to `EMAIL`), `DecisionSupport`.
- `DeviceSettings`: the PubMed switch, using the same `chat-literature` key that Ask reads. It also shows the remembered
  answer model and has "Clear Orvant settings on this device", which removes only Orvant's own localStorage keys and
  leaves the sign-in session alone.
- `AccountData` needs a signed-in, two-factor (aal2) session. Signed out, or with only aal1, it shows a link to `/login` or `/mfa`. It offers:
  - **Download my data (JSON):** profile, every conversation with its messages, and saved trials, read through the user's own RLS-scoped Supabase session.
  - **Correct my profile:** a link to `/profile`.
  - **Delete all Ask conversations** and **Remove all saved trials:** each asks for confirmation first, and reports how many rows were removed.

These pages reuse the existing kit (`CARD`, `Notice`, `PageHead`, `Icon`, `.wb-dialog`, `.btn-*`, the switch styles).
The new CSS is the `.pv-*` block at the end of `globals.css`.

Navigation added:
- Landing footer: a "PRIVACY" column with all four pages.
- Workbench sidebar: "Privacy & data". It opens in a new tab because leaving the workbench layout would drop the current search and match.
- Sign-in and sign-up forms: a one-line link to the policy. This is **not** a consent checkbox, because the backend has nowhere to record consent.

The pages are public on purpose. People must be able to read them before they sign up.

## 2. Claims verified against the code

| Claim on the pages | Evidence |
|---|---|
| Account = email, name, TOTP factor, optional passkeys | `components/AuthForm.tsx`, `app/(auth)/mfa/page.tsx`, `lib/passkey.ts` |
| Profile fields listed (birth year … country) | `supabase/schema.sql` `profiles`; `lib/profile.ts` |
| Only name, birth year, sex, diagnosis required | `schema.sql` `not null` columns; `ProfileFields.tsx` `required` |
| Name also kept on the auth record; rest stripped from the token | `take_signup_profile` / `sync_display_name` triggers |
| Health tables readable only by owner from an aal2 session (RLS) | `schema.sql` policies on all four tables |
| API refuses tokens without aal2 | `backend/api.py` `current_user` |
| Passkey replaces the email code, but the authenticator step still follows | `AuthForm.tsx` `passkey()` → `/mfa` |
| Synthetic-patient grants are operator-only (`app_metadata`) plus one demo patient; refusals logged | `api.py` `match_patient`, `match.authorize` |
| Match sends age (computed in browser), sex, diagnosis, stage, stage details, disease status, biomarkers, ECOG, meds, procedures; extra fields rejected | `lib/profile.ts` `selfProfile`; `api.py` `SelfProfile` (`extra: forbid`) |
| Rules-only match sends nothing to an AI service | `api.py`: `decide` runs only when `judge == "selective"` |
| Selective judge is off unless `NEXTRIAL_ALLOW_PAID_JUDGES=1`; consent is asked each run and not stored | `api.py`; `Match.tsx` `consent` state |
| Judge receives fact lines (no id, name, email, birth year, place) → TypeSafe Jev, then Groq | `match.fact_lines`, `decide.py`, `api.py` `judge_provider="groq"` |
| Judge answer counts only with a verbatim fact line | `match.apply_judgements`; `decide._jev_decide` |
| Ask sends the question as typed + up to 9 earlier turns + trial text to the chosen provider | `Chat.tsx` `HISTORY_TURNS = 10`; `answer._prompt`, `answer_with` |
| Ask providers: Google Gemini, Groq, Hugging Face, OpenRouter | `answer.py` `PROVIDERS`, `generate_answer` |
| Profile is not added to Ask | `Chat.tsx` `ask()` sends only turns |
| PubMed gets filtered topic words when the toggle is on **or** the question asks for literature | `api.py` `chat` (`plan.intent == "literature"`), `knowledge.search_terms` |
| ICD-10-CM gets condition names or filtered words when the question asks for codes | `api.py` `code_terms`, `knowledge.wants_icd` |
| RxNav gets up to three words after prior-therapy phrases (not passed through the filter) | `knowledge.prior_therapy_words` |
| Answer quotes/citations not in the evidence are removed and listed | `answer.validate_answer` |
| Resend receives email address + code; only sign-up and sign-in emails exist | `supabase/functions/send-email/index.ts` (`TEMPLATES`) |
| Find trials searches are not stored by the app | `api.py` `search_trials` has no audit/write |
| Access log fields (time, user id, patient id/"self", action, outcome, trials, index) | `match.audit` calls in `match.py` |
| Decision log fields; no user/patient id or facts; criterion hashed | `decide.py` end of `decide` |
| Logs are plain files; no reader, rotation or retention | `match.audit` (append to `backend/data/*.jsonl`); no other code touches them |
| Match results are not stored server-side; they live in browser state | `api.py` returns only; `workbench/layout.tsx` `match` state |
| Conversations/saved trials kept until the user deletes them; user can delete | `schema.sql` `grant ... delete`; `lib/saved.ts` |
| Deleting a conversation deletes its messages | `messages.conversation_id ... on delete cascade` |
| Account deletion is not self-service; profile has no delete grant | `schema.sql` grants (select/update only on `profiles`) |
| Account deletion by the operator cascades to profile, conversations, saved trials | `references auth.users (id) on delete cascade` |
| No advertising/analytics code | `grep` of `frontend/` and `backend/` for analytics/gtag/posthog/sentry/vercel/cookie: none |
| Browser keeps the session and settings `chat-model`, `chat-literature`, `sidebar-collapsed`, `fingerprint-offer-dismissed:*` | `supabase-js` default storage; `Chat.tsx`, `workbench/layout.tsx` |
| Synthetic patients are not real people | `README.md`, landing copy; `data/patients/processed/patients.json` |
| No encryption added by the code | No crypto in `backend/` or `frontend/lib` beyond JWT verification |

Deliberately **not** claimed: specific encryption (in transit or at rest), HIPAA, DPDP, GDPR or any other compliance, certifications,
provider data agreements, fixed retention periods, and anonymisation. "Not sold or shared for advertising" is the owner's commitment (section 4).
The code is consistent with it, since it contains no advertising or analytics code.

## 3. Missing backend capabilities and open questions

1. **Account deletion** has no self-service path. It needs a server endpoint using the Supabase service role, which should also clear access-log lines for that user.
2. **Access-log retention:** no rotation, expiry or reader. Entries hold Supabase user IDs, and they survive account deletion.
3. **Consent is not recorded.** The judge consent is per run and in memory only, and there is no policy-acceptance record at sign-up. If a law that applies requires recorded consent, this needs a table and an API.
4. **No "don't save history" option** in Ask. Every exchange is saved automatically.
5. **The download is client-side and one request.** Supabase caps a response (1,000 rows by default), and server logs are not included.
6. **Personal-detail filter** for PubMed/ICD is a regex. RxNorm words bypass it, and the Ask question itself goes to the AI provider unfiltered.
7. **Minors:** sign-up allows any birth year from 120 years ago up to the current year.
8. **A deleted conversation still open in another workbench tab** will fail to save its next message ("couldn't be saved"). This is not harmful, but it is confusing.
9. The API is not deployed yet and has no rate limiting (`backend/TASKS.md`). The security posture of the real deployment is unknown.

## 4. Owner decisions written into the pages (2026-10-15)

The owner asked for every placeholder to be replaced. These are now **commitments the owner must keep**. They are not facts the code enforces:

| Topic | What the pages now say | What keeping it takes |
|---|---|---|
| Responsible person and contact | Nirman Patel, nirman0511@gmail.com | Monitor the inbox |
| Hosting | Website and API hosted mainly on Google Cloud; database on Supabase | If another host is used, add it to "Other outside services" |
| Legal basis | You choose to give the data and ask Orvant to use it; you can take that back by clearing fields, deleting data or asking for account deletion | — |
| AI provider terms | Each company's own published terms apply; Orvant doesn't control them | — |
| Selling or advertising | Not sold, not shared for advertising | Keep ad and analytics code out |
| Retention | Kept while the account exists; nothing deleted on a timer; the access log is kept until a deletion request or shutdown; Supabase backups may hold deleted data on their normal schedule | Delete a user's access-log lines by hand on request |
| Rights requests | Anyone, anywhere, can ask for a copy, correction or deletion; reply within **30 days**; accepted only from the account's email address | Handle requests manually: account deletion in the Supabase dashboard, log lines on the server |
| Outside copies | Orvant can't delete copies held by AI providers, Resend or Supabase; users can contact those companies | — |
| Minimum age | **None.** Under-18s are encouraged to use Orvant with a parent, guardian or care team | — |
| Policy changes | The date changes; account holders are **emailed before significant changes** | There is no bulk-email feature (the send-email hook only sends auth codes), so this is manual |
| Administrator access | Only Nirman Patel has admin access to the database and server files | Revisit if anyone else is given access |
| Encryption | Relies on the standard safeguards of Google Cloud and Supabase; no further promises | — |
| Security review | None done yet (stated plainly) | Update the page if one is done |

## 5. Tests performed

| Check | Result |
|---|---|
| `npx tsc --noEmit` (frontend) | pass |
| `node lib/tidy.check.ts` | `tidy: ok` |
| `npx next build` | pass; the four `/privacy*` routes prerender as static (re-run after placeholders were replaced) |
| `next start` + `curl` of all four pages, `/` and `/signup` | 200, correct `<title>`s, `aria-current` on the active tab, footer and sign-up links present; after the edit, 0 "to be confirmed" strings, owner and email present |
| Headless Chrome screenshots at 1280px and at 375px (page inside a 375px iframe) | readable. Rows stack, and nothing scrolls sideways except the tab bar (taken before the placeholders were replaced; the layout is unchanged) |
| `python3.11 -m pytest backend/tests -q` with all AI keys unset | 279 passed (backend unchanged) |

**Not tested:**
- Download, delete-all and the confirmation dialogs against a real Supabase session. There is no test project, and touching the live one was out of scope. They use the same client calls and RLS grants as the existing `lib/saved.ts`, plus `.select()` after `.delete()`, which needs the `select` grant the tables already have.
- A full screen-reader pass.
- No live AI or NLM calls were made.

## 6. Remaining launch blockers

1. Legal review of the final text, especially the "no minimum age" choice for a health app, and the 30-day reply promise.
2. Decide access-log retention, and implement rotation and per-user deletion. Until then, deletion is by hand.
3. Build account deletion, or be ready to do it by hand within the promised 30 days.
4. Exercise the download and deletion buttons against a staging Supabase project.
5. Re-check these pages whenever data flows change: a new provider, a new host, a new log, profile fields, or the judge route. Then update `LAST_UPDATED` in `app/privacy/layout.tsx`.
