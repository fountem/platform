# fountem-platform

## What this is
Monorepo for the Fountem platform — apps, shared packages, and backend services
for content verification / detection.

## Stack
TypeScript, Next.js 15, React 19, Supabase, Jest (ts-jest), ESLint 9 (flat
config). Anthropic + OpenAI SDKs. Turbo + npm workspaces. Node >=20, npm 10.9.2.

## Commands
- Install: `npm install`
- Build: `npm run build` (turbo run build)
- Test: `npm run test` (jest)
- Lint: `npm run lint` (eslint . --max-warnings 0)
- Type-check: `npm run type-check` (turbo run type-check)
- Run locally: `npm run dev`; `npm run dev:mock` for mocked services

## Layout
- `apps/` — bot, fountem, marketing, unfaked
- `packages/` — core, db, detection, live, rag, social, ui, verdict
- `services/` — live-gateway (TS), resolver (Python)
- `context/` — project docs/specs (not application code)
- `scripts/` — eval-harness, seed scripts

## Conventions
- Workspace aliases `@fountem/<pkg>` map to `packages/<pkg>/src/index.ts`
  (see jest `moduleNameMapper` and tsconfig paths).
- Tests live in `__tests__/` under `packages/**` and `apps/bot/`.
- `services/resolver` is Python — excluded from ESLint and linted separately.

## Out of scope / do not touch
- Generated/vendored: `node_modules/`, `.next/`, `dist/`, `.turbo/`,
  `eval-results/`, `*.tsbuildinfo`.
