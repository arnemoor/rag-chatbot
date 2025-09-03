# Repository Guidelines

## Project Structure & Module Organization
- root: workspace with two packages (`worker`, `widget`) plus `scripts/`, `docs/`, `examples/`, `sample-documents/`.
- `worker/` (TypeScript, Cloudflare Worker): `src/routes/`, `src/middleware/`, `src/utils/`, tests colocated as `*.test.ts`.
- `widget/` (JavaScript, Cloudflare Pages): `src/components/`, `src/services/`, `src/utils/`, tests as `*.test.js`, built assets in `dist/`.

## Build, Test, and Development Commands
- Install all deps: `./scripts/install-dependencies.sh`
- Run all tests: `npm test` (calls `scripts/test-all.sh` for worker and widget)
- Worker dev server: `npm run dev:worker` (Wrangler dev)
- Widget build (watch): `npm run dev:widget` or `npm run build` in `widget/`
- Lint all: `npm run lint` | Fix: `npm run lint:fix`
- Format all: `npm run format` | Check: `npm run format:check`
- Per-package tests/coverage:
  - Worker: `npm run test:worker` | `npm run test:worker:coverage`
  - Widget: `npm run test:widget` | `npm run test:widget:coverage`

## Coding Style & Naming Conventions
- Formatter: Prettier (2-space indent, 100 char line width, single quotes). Run `npm run format`.
- Linting: ESLint (root config), TypeScript rules in `worker`. Run `npm run lint`.
- Files: TypeScript in `worker`, JavaScript in `widget`. Tests: `*.test.ts` / `*.test.js` colocated with source.
- Variables/functions: lowerCamelCase; types/interfaces (TS) in PascalCase; constants in UPPER_SNAKE_CASE.

## Testing Guidelines
- Framework: Vitest (both packages); widget uses Testing Library for DOM utilities.
- Write fast, isolated unit tests near code. Name as `module.test.ts|js`.
- Run focused tests with `vitest watch` in each package (`npm run test:worker:watch`, `npm run test:widget:watch`).
- Aim for meaningful coverage on routes, components, and utilities; use coverage jobs above when needed.

## Commit & Pull Request Guidelines
- Conventional Commits: `type(scope): summary` (e.g., `feat(worker): add rate limiting`). Types: feat, fix, docs, style, refactor, test, chore.
- Before opening a PR: run lint, format, and tests; include description, linked issue(s), and screenshots or logs for UI/behavior changes.
- Keep changes focused and small; update docs in `docs/` when behavior/config changes.

## Security & Configuration Tips
- Copy `.env.example` to `.env` and set Cloudflare credentials; see `docs/SECURITY.md` and `docs/SETUP.md`.
- Required engines: Node 18+ / npm 8+. Use Wrangler v4 for local/dev deploy tasks.
