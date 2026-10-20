# Sr. Tommy UI Constitution

## Core Principles

### I. Quality Gates Are Never Weakened

Every change MUST pass `pnpm check:fast` (typecheck, lint, format) before it is considered done, and
CI MUST enforce the same gate. Changes MUST NOT add `@ts-ignore`, `eslint-disable`, skipped tests
or lowered thresholds to make a check pass. New code MUST NOT introduce `any`, `console.*` calls or
commented-out code.
Rationale: gates only protect the codebase if they cannot be bypassed one exception at a time.

### II. Test What Matters

Pure logic (date handling, reordering, schema validation, mappers, hooks) MUST have unit tests.
User-facing flows (registration, groups, events, location) MUST have Playwright e2e tests that mock
Auth0 and the backend. A bug fix MUST include a test that fails without the fix.
Rationale: the product handles church members' data and attendance; regressions are costly and
usually found by users first.

### III. Security and Privacy by Default

Secrets and environment files MUST NOT be committed; only `.env.example` is versioned. Environment
variables MUST be validated at startup (`app/env.ts`). Authorization decisions MUST be enforced by
the backend; the UI guard only improves experience. Third-party scripts that track users (e.g.
Google Tag Manager) MUST NOT load before the user has consented. Personal data MUST NOT be logged
or placed in URLs.
Rationale: the app stores personal data of members, including minors, and is subject to privacy law.

### IV. Accessible, Spanish-First UI

All user-facing text MUST be in Spanish; code identifiers and comments MUST be in English. Interactive
elements MUST have accessible names, images MUST have `alt` text and forms MUST show validation
errors. Every user-visible loading, empty and error state MUST be handled explicitly (no blank
screens or placeholder text such as "Not found" while loading).
Rationale: users are non-technical church staff and volunteers on varied devices.

### V. Simplicity and Deliberate Dependencies

Features MUST use the existing stack (Next.js, MUI, SWR, react-hook-form + zod, Auth0) before
adding a library. A new dependency MUST be justified in its PR and MUST NOT duplicate an existing
one. Builder.io is legacy and being removed: no new features may depend on it. Dependencies MUST be
kept current through grouped, regularly reviewed updates.
Rationale: every dependency is maintenance and attack surface; stale ones compound upgrade cost.

### VI. Small, Traceable Changes

Work MUST happen on a branch and reach `main` through a pull request; nobody pushes to `main`.
Commits and PR titles MUST follow Conventional Commits. Non-trivial features MUST go through
spec-kit (spec, plan, tasks) rather than ad-hoc notes. PRs SHOULD be scoped to one concern.
Rationale: small reviewed changes are easier to verify, revert and explain.

## Technical Constraints

- Runtime: Node >= 22 and pnpm (see `.nvmrc` and `packageManager`); `pnpm-lock.yaml` MUST be
  committed and CI MUST install with `--frozen-lockfile`.
- Stack: Next.js App Router, React, TypeScript in `strict` mode, MUI, SWR, Auth0, zod.
- API access MUST go through the services in `app/(api)/services` and the single client in
  `app/(api)/client.ts`; components MUST NOT build URLs, create HTTP clients or read tokens directly.
- Code lives next to what uses it (see `docs/architecture.md`); shared UI goes in `app/(components)/`.
- GitHub Actions MUST be pinned by commit SHA.
- `next build` MUST succeed in CI before merge.

## Development Workflow

- Run `nvm use`, `pnpm install` and `pnpm dev` per the README.
- Before opening a PR: `pnpm check:fast` passes and relevant tests (`pnpm test:e2e`) pass.
- The pre-push hook runs `pnpm check:fast`; `--no-verify` MUST NOT be used to land a failing change.
- Reviewers MUST verify compliance with this constitution; deviations MUST be justified in the PR.

## Governance

This constitution supersedes other project practices where they conflict; `AGENTS.md` and
`README.md` provide runtime guidance and MUST stay consistent with it. Amendments are made by pull
request that updates this file, states the reason and, for breaking changes, a migration plan.
Versioning follows semantic versioning: MAJOR for removed or redefined principles, MINOR for added
principles or materially expanded guidance, PATCH for clarifications. Compliance is reviewed on every
PR and revisited whenever a retrospective or incident shows a principle is missing or wrong.

**Version**: 1.1.0 | **Ratified**: 2026-10-17 | **Last Amended**: 2026-10-20
