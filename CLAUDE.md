# CLAUDE.md

Seamflow — TypeScript full-stack app. React Router v7 web app + Hono API, Supabase (Postgres), deployed as one Vercel project. Yarn 4 workspaces monorepo.

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
10. Supabase is accessed **only from `apps/api`** (service role key). Never from browser code.
11. Every schema change is a new SQL file in `supabase/migrations/`, then `yarn db:types`
12. Use context7 MCP for latest library references
13. Add tests: unit tests next to the file (`*.test.ts`), API tests in `./test/api-tests/`
14. Prefer editing existing files over creating new ones
15. Only create documentation when explicitly requested

## Commands

```bash
nvm use                 # Node 24 (.nvmrc); Vite 7 needs >= 22.12
yarn install

yarn db:start           # local Supabase (Docker); prints the service role key
cp frontend/web/.env.example frontend/web/.env   # paste the service role key
yarn db:reset           # apply supabase/migrations to local DB

yarn dev                # http://localhost:3000 (web + /api)
yarn typecheck          # all workspaces
yarn test               # vitest
yarn build              # Vercel build output

yarn db:types           # regenerate packages/shared-types/src/database/Database.type.ts
yarn db:push            # push migrations to linked remote project (`yarn supabase link` first)
```

## Architecture

```
├── packages/                 # Shared libraries (@seamflow/* prefix)
│   ├── shared-types          # Domain types, env type, generated Supabase Database type
│   ├── shared-utils          # FetchRequest, ExpectedServerError
│   └── shared-controllers    # API client controllers (isomorphic)
├── apps/
│   └── api                   # Hono app: src/api/[domain]/[Domain].routes|handler|service.ts
├── frontend/
│   └── web                   # React Router v7 (SSR) — serves `/api/*` via routes/api.ts
├── supabase/                 # config.toml + SQL migrations
└── test/                     # API tests + test helpers
```

Request flow: `component → shared-controllers → /api/* (frontend/web/app/routes/api.ts) → apps/api routes → handler → service → Supabase`

**Tech stack**: Node 24, TypeScript, Yarn 4 | React 19, React Router v7, Tailwind v4, Vite 7 | Hono | Supabase | Vitest | Vercel

## Environment

- API env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (type: `SharedTypes.SeamflowEnvironment`), read only through `getSeamflowEnvironment()` in `apps/api/src/configs/app.config.ts`
- Local: `frontend/web/.env` (loaded by `dotenv` in `vite.config.ts`)
- Vercel: project env vars per environment (Production / Preview), or injected by the Supabase integration

## Deploy

Supabase:

1. Create a project at supabase.com
2. `yarn supabase login && yarn supabase link --project-ref <ref>`
3. `yarn db:push` to apply `supabase/migrations`

Vercel:

1. Import the repo, set **Root Directory** to `frontend/web` (framework: React Router, auto-detected)
2. Node.js version: 24.x
3. Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ENABLE_EXPERIMENTAL_COREPACK=1` (so Vercel uses Yarn 4 from `packageManager`)

## Workflow

1. **Plan** — Check `./plans/` for requirements. Create an implementation plan if missing.
2. **Implement** — Work as a senior staff fullstack engineer.
3. **Test** — Add tests, run `yarn typecheck && yarn test:run`.

## User custom prefix

- question: just answer the prompt, **DO NOT** edit any files
