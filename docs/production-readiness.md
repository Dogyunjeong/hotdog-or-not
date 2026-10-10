# Production readiness review

High-level review of the deployed app (`main` @ `de1def4`, v0.2) with the v0.3 work in progress in mind, by four parallel reviews. Covers security and privacy, operations and delivery, engineering and testing, and user experience. Code changes are suggestions only — nothing here has been implemented.

## Verdict

The core design is sound and security-minded, and it is safe to demo. It is **not yet ready for unattended public traffic**: the endpoints that spend money have no limits, nothing gates what reaches production, and there is no visibility once it is running. Most fixes are small (S) and config-heavy.

## What is already strong

- **Ownership enforced on the server.** Every route resolves the visitor's session server-side and checks storage paths against the visitor's own folder. "Not yours" and "gone" return the same 404.
- **Secrets stay on the server.** Supabase is reached only with server-only code; every table has RLS on with no policies and both buckets are private. The session id (a bearer secret) is kept apart from the non-secret folder id that appears in URLs.
- **Uploads bypass the API.** Photos go straight to storage through single-use signed URLs; the server re-validates the stored object instead of trusting the client.
- **Retry-safe classification.** The temp path doubles as an idempotency key, a unique column blocks duplicates, and a replay returns the saved record. The client retries only 5xx and network errors.
- **Clean layering.** Route files are 1–2 line adapters; layer boundaries hold (no server imports in client code, no framework imports in `shared/`). Tests use in-memory fakes and drive the real API controllers. Typecheck, lint and 32 tests pass.
- **Production basics in place.** Functions and database both in London, HSTS and security headers live, previews behind Vercel Authentication, no secrets in git history.

## Top priorities

| #   | Priority                                                                                                                                                                                                             | Why                                                                                                                                                                                            | Effort | Type          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------- |
| 1   | **Limit the paid endpoints**: rate limits per IP and session, daily quotas with a global cut-off, a bot check on upload, an OpenAI project budget with alerts, and per-call token/time caps                          | Anyone can script uploads and classifications: ~250 uploads fill the free storage quota, and every classification costs OpenAI money. v0.3's high-detail images and guest mode make this worse | M      | code + config |
| 2   | **Add CI and protect `main`**: typecheck, lint, format check, tests and build on every PR; require a green PR to merge                                                                                               | Every push to `main` deploys to production with no automated check                                                                                                                             | S      | config        |
| 3   | **Separate Preview from Production**: a second Supabase project and its own capped OpenAI key                                                                                                                        | Every branch build holds the production service-role key and writes to production data — risky once v0.3's delete and retention code lands                                                     | S      | config        |
| 4   | **Bound every external call**: OpenAI timeout (~25 s, 1 retry), Supabase fetch timeout, route `maxDuration`, client abort                                                                                            | Today a stalled dependency means a spinner for up to 5 minutes (OpenAI SDK default is 10 minutes with 2 retries)                                                                               | S      | code          |
| 5   | **Privacy basics for a UK launch**: a privacy notice with a contact, processor agreements (OpenAI, Supabase, Vercel) and the US transfer basis; set OpenAI `store: false`; expire inactive sessions and their photos | Photos go to a US processor with no notice; photos and OpenAI's copy are kept indefinitely                                                                                                     | S–M    | docs + code   |
| 6   | **See production**: a readiness health check (env, DB, storage), an uptime monitor on it, error tracking, and one structured log line per classification (timings, tokens)                                           | Outages are found by users; Vercel Hobby keeps logs ~1 hour; the free Supabase project pauses after 7 idle days and the static health check stays green                                        | S–M    | code + config |
| 7   | **Automate migrations**: CI resets the DB from migrations and checks generated types; apply migrations from CI before promoting a deploy                                                                             | Migrations are applied by hand from a laptop, with nothing tying them to the deploy that needs them                                                                                            | M      | config        |
| 8   | **Test the glue**: an integration job against local Supabase, and one browser smoke test (upload → classify → history) with OpenAI stubbed                                                                           | The riskiest code (storage + DB + cookie) is only tested through hand-written fakes                                                                                                            | M      | code + config |
| 9   | **Make upload forgiving**: resize and fix orientation in the browser before validating (the model only sees ~512 px), handle HEIC, make the dashed preview a tap/drop/paste target                                   | Large phone photos hit the 4 MB limit with a dead-end message, full-size files upload slowly on mobile, and dropping a file on the dashed box navigates away                                   | M      | code          |

## By area

**Security and abuse** — Beyond #1: add a static Content-Security-Policy (start in report-only) and `Cross-Origin-Opener-Policy`; move to per-environment `sb_secret_` keys with a rotation runbook; longer term, hash the stored session token, accept only server-issued session ids, and use a `__Host-` cookie. Cap model output length and tell the model to treat text in the image as content, not instructions.

**Privacy and compliance (UK GDPR / PECR)** — v0.3's consent-gated guest mode, EXIF stripping and hard delete with a PII-free audit table are the right design. Still missing: the privacy notice and records above, a retention period for saved photos and sessions (v0.3's cron only cleans temp uploads), and making v0.3's photo-location lookup opt-in (or offline) since it sends coordinates to a third party.

**Reliability and operations** — Make classification resumable after a partial failure (today a failed insert after the image move strands the visitor and orphans the image; v0.3 reorders this correctly). Add backups and stated RPO/RTO (free plan has none), a short runbook (OpenAI outage, Supabase paused, key rotation, rollback), and kill switches for OpenAI and geocoding. Dependabot alerts and security updates are off — turn them on.

**Engineering** — Return error codes and a request id (today errors carry only UI copy, and a model refusal is offered as retryable); wrap the session/error/cookie steps repeated in every handler into one function; derive types from shared zod schemas instead of keeping three copies in sync; lint the house rules and layer boundaries; add a small labelled image set to evaluate model or prompt changes. Remove unused abstractions (`IRequest` injection, `errorData`).

**User experience and performance** — Accessibility basics are strong: every colour pair checked passes WCAG AA in both themes, touch targets are at least 44 px, status changes are announced once, and reduced motion is respected. The home page is prerendered and edge-cached. Gaps:

- History "thumbnails" are full-size originals behind 1-hour signed URLs that change on every load, so nothing caches and photos show "no longer available" after an hour. v0.3 adds real thumbnails; also serve images from a stable same-origin URL that redirects to a fresh signed one.
- First visit shows two interruptions (onboarding, then the cookie box) before the first action, and on small phones the upload button sits below the fold.
- No error page or custom 404 (`error.tsx`, `global-error.tsx`, `not-found.tsx`).
- The copy "saved in this browser" hides that photos are stored on the server and sent to OpenAI.
- Small wins: drop the unused Geist Mono font, load the consent library only when consent is missing, set `lang="en-GB"`.

## Presenting the project

For reviewers, the first two minutes matter most. Beyond the README: a short demo GIF and real screenshots (light, dark, mobile) next to the live link; a "decisions and trade-offs" section naming the rejected alternative for each choice (direct signed upload vs proxying bytes, anonymous session vs auth, model and detail level with cost per check); a CI badge with test counts; and a short privacy and security summary.

## v0.3 merge notes

The v0.3 work is one large local commit built on `d7badda`, four commits behind GitHub `main`, and its `origin` still points at the deleted `seamflow` repo. Rebase it onto `main` and keep what `main` fixed: `vercel.json` with `framework: "nextjs"` and `lhr1` (plus the new cron), no `"type": "module"` in `package.json`, and the security headers in `next.config.ts` (now wrapped by next-intl — add a test that asserts them). Ship it as a few focused PRs rather than one 8.7k-line commit, and apply its migrations before the code that needs them.

## Production upgrade path

Free tiers are fine for a demo but not for production: Vercel Hobby is non-commercial with ~1 hour of logs; Supabase Free pauses when idle and has no backups; branch protection on a private repo needs GitHub Pro (or a public repo). For real traffic: Vercel Pro, Supabase Pro (daily backups, optional PITR), and GitHub Team.
