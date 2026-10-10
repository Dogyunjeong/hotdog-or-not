# CLAUDE.md

Hotdog or Not Hotdog (`hotdog-or-not`): a visitor uploads an image (signed URL → Supabase Storage), an OpenAI vision model says whether it's a hotdog, and the result joins their history. One Next.js 16 (App Router) project with API route handlers, Supabase (Postgres + Storage), deployed to Vercel.

Human-facing overview and setup: `README.md`. Production readiness findings: `docs/production-readiness.md`.

## Critical Rules

** never revert with git **

1. Follow `./guidelines/coding_style_guideline.md` for code style — **do not duplicate rules here**
2. Follow `./guidelines/project_structure.md` for structure and env config
3. Follow `./guidelines/frontend_guideline.md` for frontend development
4. Implement backend and frontend together (full-stack engineer mindset)
5. When touching a module, evaluate how it affects every module importing it. Don't break them.
6. Implement a simple and clean way by modularizing, not abstracting. Avoid over engineering.
   - When logic is complex, split early and keep each branch simple
   - Each file has one responsibility, no overlapping
   - File, function, and variable names are context — keep them explicit and readable
   - Never just stack logic on top of existing logic; refactor so the result reads as one design
7. Refactoring is not optional. It is mandatory.
   - Before a new feature, refactor first if it helps readability and maintainability
   - Don't create similarly named files for the same domain/concern — refactor and reuse
   - Remove unused code after implementing
   - If you can reduce layers of abstraction, do it. **IMPORTANT**
8. All API calls go through `shared/controllers` — API URLs start with `/api`
9. Update `shared/controllers` and `shared/types` when changing API routes
10. Supabase and OpenAI are accessed **only from `server/`** (guarded by `import 'server-only'`). Never from browser code.
11. Every schema change is a new SQL file in `supabase/migrations/`, then `yarn db:types`
12. **Next.js 16 differs from your training data** — read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. See `AGENTS.md`. Use context7 MCP for other libraries.
13. Add tests: unit tests next to the file (`*.test.ts`), API tests in `./test/api-tests/`
14. Prefer editing existing files over creating new ones
15. Only create documentation when explicitly requested
16. i18n (next-intl): every user-facing string lives in `messages/{en,ko}/{namespace}.json` (one file per UI area; English is the typed source). Use `useTranslations`/`getTranslations`, `useFormatter` for numbers/dates, and `Link`/`usePathname` from `@/i18n/navigation`. The URL is the only language state (`/en`, `/ko`; `/` redirects by Accept-Language); never add a locale cookie. API errors carry an `errorCode` that the UI translates.

## Commands

```bash
nvm use                 # Node 24 (.nvmrc)
yarn install
yarn db:start           # local Supabase (Docker); applies migrations, prints keys
cp .env.example .env.local   # set OPENAI_API_KEY + Supabase keys

yarn dev                # http://localhost:3000 (web + /api)
yarn typecheck          # next typegen + tsc
yarn lint               # eslint (eslint-config-next)
yarn test               # vitest (watch)
yarn test:run           # vitest, single run
yarn build              # next build

yarn db:stop            # stop local Supabase
yarn db:reset           # re-apply supabase/migrations to local DB
yarn db:types           # regenerate shared/types/database/Database.type.ts
yarn db:push            # push migrations to linked remote project (`yarn supabase link` first)
```

## Architecture

```
├── app/                      # Next.js routes; app/api/**/route.ts are 1–2 line adapters to server/ handlers
├── components/[Domain]/      # UI by domain; components/primitives/ for reusable primitives
├── hooks/                    # Stateful UI logic split from components
├── controllers/              # Controller instances for the browser (apiControllers.ts)
├── server/                   # Server-only (`import 'server-only'`)
│   ├── api/[domain]/         # [Domain].handler.ts, [Concern].service.ts, [Domain].prompt.ts
│   ├── clients/              # openai/, supabase/ (getSupabaseClient, SupabaseStorage.client)
│   ├── configs/              # env access
│   └── utils/                # handleError, visitorSessionCookie
├── shared/                   # Isomorphic (browser + server), no Node/DOM APIs
│   ├── types/                # Domain types + consts (HotdogTypes, VisitorSessionTypes), Database type
│   ├── utils/                # FetchRequest, uploadFileToSignedUrl, ExpectedServerError, validators
│   └── controllers/          # API client controllers
├── supabase/                 # config.toml + SQL migrations (tables, storage buckets)
└── test/                     # API tests + shared fakes (test/helpers)
```

Request flow: `component → hook → shared/controllers → app/api/**/route.ts → server handler → service → clients (OpenAI, Supabase)`

**Tech stack**: Node 24, TypeScript, Yarn 4 | Next.js 16, React 19, Tailwind v4 | OpenAI (Responses API, structured outputs via zod) | Supabase | vanilla-cookieconsent | Vitest | Vercel

## Environment

- API env: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (type: `SharedTypes.HotdogOrNotEnvironment`), read only through `getEnvironmentVariable()` in `server/configs/app.config.ts`
- Local: `.env.local` (loaded by Next.js)
- Vercel: project env vars per environment (Production / Preview)

## Deploy

Production: https://hotdog-or-not.vercel.app — Vercel project `hotdog-or-not`, GitHub `Dogyunjeong/hotdog-or-not`, Supabase project `hotdog-or-not`. Push to `main` deploys production; other branches get preview deployments.

Vercel:

1. Import the repo; root directory is the repo root. `vercel.json` pins the framework (`nextjs`), the function region (`lhr1`, London, next to the database) and the daily data-retention cron
2. Node.js 24.x is pinned by `engines.node` in `package.json`. Keep `package.json` free of `"type": "module"` — Vercel's Corepack-installed Yarn 4 crashes with it
3. Env vars (Production and Preview): `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ENABLE_EXPERIMENTAL_COREPACK=1` (so Vercel uses Yarn 4 from `packageManager`); Production also `CRON_SECRET` (the cron route answers 401 without it). Preview currently uses the production Supabase project and OpenAI key — preview deployments read and write production data

Supabase (deploy before the app — migrations create the tables and storage buckets):

1. Create a project at supabase.com in region `eu-west-2` (London — the audience is in the UK; matches the Vercel function region). Production project: `hotdog-or-not`
2. `yarn supabase login && yarn supabase link --project-ref <ref>` (`supabase login` needs an interactive terminal)
3. `yarn db:push` to apply `supabase/migrations`. It applies every file in that folder — run it from a checkout of the commit being deployed, never with unfinished migrations present. Never edit a migration that has already been applied; add a new one

## Workflow

1. **Plan** — Check `./plans/` for requirements. Create an implementation plan if missing.
2. **Implement** — Work as a senior staff fullstack engineer.
3. **Test** — Add tests, run `yarn typecheck && yarn test:run`.

## User custom prefix

- question: just answer the prompt, **DO NOT** edit any files
