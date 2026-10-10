# CLAUDE.md

Seamflow — "Hotdog or Not Hotdog": upload an image, it's stored in Supabase Storage and an OpenAI vision model says whether it's a hotdog. Next.js 16 (App Router) + API route handlers, Supabase (Postgres), deployed as one Vercel project. Yarn 4 workspaces monorepo.

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
8. All API calls go through `packages/shared-controllers` — API URLs start with `/api`
9. Update `shared-controllers` and `shared-types` when changing API routes
10. Supabase and OpenAI are accessed **only from `apps/api`**. Never from browser code.
11. Every schema change is a new SQL file in `supabase/migrations/`, then `yarn db:types`
12. **Next.js 16 differs from your training data** — read the relevant guide in `frontend/web/node_modules/next/dist/docs/` (or root `node_modules/next/dist/docs/`) before writing Next.js code. See `frontend/web/AGENTS.md`. Use context7 MCP for other libraries.
13. Add tests: unit tests next to the file (`*.test.ts`), API tests in `./test/api-tests/`
14. Prefer editing existing files over creating new ones
15. Only create documentation when explicitly requested

## Commands

```bash
nvm use                 # Node 24 (.nvmrc)
yarn install
yarn db:start           # local Supabase (Docker); applies migrations, prints keys
cp frontend/web/.env.example frontend/web/.env.local   # set OPENAI_API_KEY + Supabase keys

yarn dev                # http://localhost:3000 (web + /api)
yarn typecheck          # all workspaces
yarn lint               # eslint (eslint-config-next)
yarn test               # vitest
yarn build              # next build

yarn db:stop            # stop local Supabase
yarn db:reset           # apply supabase/migrations to local DB
yarn db:types           # regenerate packages/shared-types/src/database/Database.type.ts
yarn db:push            # push migrations to linked remote project (`yarn supabase link` first)
```

## Architecture

```
├── packages/                 # Shared libraries (@seamflow/* prefix)
│   ├── shared-types          # Domain types + consts (HotdogTypes), env type, Supabase Database type
│   ├── shared-utils          # FetchRequest, ExpectedServerError, domain validators (client + server)
│   └── shared-controllers    # API client controllers (isomorphic)
├── apps/
│   └── api                   # Server-only: src/api/[domain]/[Domain].handler|service|prompt.ts, src/supabase + src/openai clients
├── frontend/
│   └── web                   # Next.js App Router; app/api/**/route.ts are thin adapters to apps/api handlers
├── supabase/                 # config.toml + SQL migrations (tables, storage buckets)
└── test/                     # API tests
```

Request flow: `component → hook → shared-controllers → app/api/**/route.ts → apps/api handler → service → clients (OpenAI, SupabaseStorageClient)`

**Tech stack**: Node 24, TypeScript, Yarn 4 | Next.js 16, React 19, Tailwind v4 | OpenAI (Responses API, structured outputs via zod) | Supabase | Vitest | Vercel

## Environment

- API env: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (type: `SharedTypes.SeamflowEnvironment`), read only through `getEnvironmentVariable()` in `apps/api/src/configs/app.config.ts`
- Local: `frontend/web/.env.local` (loaded by Next.js)
- Vercel: project env vars per environment (Production / Preview)

## Deploy

Vercel:

1. Import the repo, set **Root Directory** to `frontend/web` (framework: Next.js, auto-detected)
2. Node.js version: 24.x
3. Env vars: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ENABLE_EXPERIMENTAL_COREPACK=1` (so Vercel uses Yarn 4 from `packageManager`)

Supabase (deploy before the app — migrations create the `hotdog-images` bucket):

1. Create a project at supabase.com
2. `yarn supabase login && yarn supabase link --project-ref <ref>`
3. `yarn db:push` to apply `supabase/migrations`

## Workflow

1. **Plan** — Check `./plans/` for requirements. Create an implementation plan if missing.
2. **Implement** — Work as a senior staff fullstack engineer.
3. **Test** — Add tests, run `yarn typecheck && yarn test:run`.

## User custom prefix

- question: just answer the prompt, **DO NOT** edit any files
