# Agent guide

Read [README.md](./README.md) first for setup and how to run the app. This file only adds the rules for working on this repo.

## Setup

Node >= 22 and pnpm (see `.nvmrc` and `packageManager`). Run `nvm use` and `pnpm install`.

## Checks

- `pnpm check:fast` while you work: typecheck, lint, architecture, `check:tests`, format and the unit and component tests.
- `pnpm check` before you consider a task done: the same, with the unit tests under the coverage threshold, as CI. The pre-push hook runs it. The build and the e2e tests stay in CI.
- `pnpm check:arch` checks the import rules of [docs/architecture.md](./docs/architecture.md) with dependency-cruiser (`.dependency-cruiser.cjs`). Violations that already existed are listed in `.dependency-cruiser-known-violations.json`; only new ones fail. Never add to that file to make a change pass: fix the import, or explain to the product owner why the rule does not fit.
- `pnpm check:tests` (`scripts/test-levels.mts`) checks that every Playwright test has exactly one level tag: `@smoke`, `@story` or `@journey`.
- `pnpm test:smoke` (`@smoke`) and `pnpm test:e2e` (`@story` and `@journey`) are Playwright and need the app's env vars. CI runs them in the `e2e` job of `.github/workflows/ci.yml`, `@smoke` then `@story` then `@journey`, only after the static checks, the unit tests and the build pass.
- Never weaken a check to make a change pass: no new `@ts-ignore`/`eslint-disable`, no skipped tests, no lowered thresholds.

## Tests

Before writing, changing or reviewing a test, follow the `test-pyramid` skill (`.claude/skills/test-pyramid/SKILL.md`). It is the testing standard of this repo: the levels and how to choose one, the names and tags, the test doubles, and how to write a test here.

## Dependencies

The product owner wants the latest versions at all times. When a dependency problem shows up (`pnpm audit` or Dependabot reports a vulnerability, a deprecation, a failing check caused by an old package), do not patch around it with an `overrides` entry or by pinning only the vulnerable package: update the dependency and its parents to the latest version, major ones included, and fix what breaks. Run `pnpm outdated` and update the rest while you are at it. Use an override only as a last resort when no released parent allows the fix, and write it in the technical debt table (see below) with when to remove it.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `<type>: <subject>`, subject in lowercase and imperative mood.

Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.

A `commit-msg` hook (husky + commitlint) rejects anything else. The hook needs Node >= 22.
A `pre-push` hook runs `pnpm check` (only the format check when the branch changes nothing but docs, `*.md` files or anything under `docs/`; CI skips the same jobs then, see `scripts/only-docs-changed.sh`). `git push --no-verify` skips it; CI does not.

## Pull requests

Keep each PR short enough to review in one sitting, and stack PRs when a change does not fit in one: see the `small-prs` skill (`.claude/skills/small-prs/SKILL.md`).

Work on a branch, never push directly to `main`. Open a PR with `gh pr create`; the title follows the same Conventional Commits format.

## Auto-format

Claude Code runs Prettier and ESLint `--fix` on every file it edits (`.claude/hooks/format-on-edit.sh`). Do not fight the formatter.

Two more hooks keep the agent honest (`.claude/settings.json`):

- `post-edit.sh` lints each edited `.ts`/`.tsx` file under `app/` or `tests/` and hands the remaining ESLint errors back to the agent, which has to fix them before going on.
- `stop-check.sh` runs typecheck, lint, `check:arch` and `check:tests` when a turn ends with uncommitted changes, asks once for a test when changed code under `app/` has no changed test that names or imports it (router screens such as `page.tsx` and the generated client are exempt), and keeps the agent working until they pass. CI runs the same commands.

## Pending work and cleanup

Anything left to do or to clean up (unused secrets, dead code, legacy names...) goes into `docs/tech-debt-and-future-work.md`. Ask the product owner before doing any item from that list, especially cleanups; never remove things on your own initiative.

What the product owner decides **not** to do (a discarded item or idea) does not stay in that file: record it as an ADR in `docs/adr/` (`NNNN-short-title.md`, see its README) with the context and the reason the owner gave, then remove the item from the table. Never invent a reason; if none was given, say so. Done items are removed from the table too.

## Specs and plans

<!-- check-docs ignore: SPEC.md, tasks/plan.md (files this section says not to write) -->

Use spec-kit (the `speckit-*` skills) for specs, plans and task lists. Do not use addy's `/spec` or `/planning` commands, the `spec-driven-development` and `planning-and-task-breakdown` skills, or write `SPEC.md` or `tasks/plan.md` at the repo root. Those write to a second place and split the plan.

Other addy skills stay available for code review, TDD, security and performance.

## Architecture and code style

Read [docs/architecture.md](./docs/architecture.md) (where code goes, how data is read and written) and [docs/code-style.md](./docs/code-style.md) (how to write it) before adding code.

## Language

Code identifiers and comments are in English. UI copy and user-facing messages are in Spanish.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
