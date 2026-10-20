# Agent guide

Read [README.md](./README.md) first for setup and how to run the app. This file only adds the rules for working on this repo.

## Setup

Node >= 22 and pnpm (see `.nvmrc` and `packageManager`). Run `nvm use` and `pnpm install`.

## Checks

- `pnpm check:fast` (typecheck, lint, format) after editing. Run it before you consider a task done.
- `pnpm test:e2e` (Playwright) needs the app's env vars and a backend; see the Playwright workflow.
- Never weaken a check to make a change pass: no new `@ts-ignore`/`eslint-disable`, no skipped tests, no lowered thresholds.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `<type>: <subject>`, subject in lowercase and imperative mood.

Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.

A `commit-msg` hook (husky + commitlint) rejects anything else. The hook needs Node >= 22.
A `pre-push` hook runs `pnpm check:fast`. `git push --no-verify` skips it; CI does not.

## Pull requests

Work on a branch, never push directly to `main`. Open a PR with `gh pr create`; the title follows the same Conventional Commits format.

## Auto-format

Claude Code runs Prettier and ESLint `--fix` on every file it edits (`.claude/hooks/format-on-edit.sh`). Do not fight the formatter.

## Specs and plans

Use spec-kit (the `speckit-*` skills) for specs, plans and task lists. Do not use addy's `/spec` or `/planning` commands, the `spec-driven-development` and `planning-and-task-breakdown` skills, or write `SPEC.md` or `tasks/plan.md` at the repo root. Those write to a second place and split the plan.

Other addy skills stay available for code review, TDD, security and performance.

## Architecture

Read [docs/architecture.md](./docs/architecture.md) before adding code. The short version:

- Code lives next to what uses it (by proximity). A component used by one screen goes beside its `page.tsx`; shared ones go in `app/(components)/`. No `features/` or `utils/` folders.
- Every call to srtomy-api goes through `app/(api)/services` (typed functions and SWR hooks) and the single client in `app/(api)/client.ts`. Components never build URLs or use axios directly. Response types live in `app/(api)/types.ts`.
- Screens that read data handle loading, not-found and error (`Loading`, `ResourceError`).
- Unit tests sit next to the file they test; e2e tests are in `tests/`.

## Language

Code identifiers and comments are in English. UI copy and user-facing messages are in Spanish.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
