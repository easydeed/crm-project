# onrecord — engineering guardrails

Read `PROJECT_STATE.md` before any task. It is authoritative on scope, principles, and rejected ideas.

## Non-negotiable invariants

These apply to every task without being restated. A change that violates one of these is wrong even if it satisfies the task description. If a task appears to require violating one, stop and report `BLOCKED`.

1. **No dead controls.** Every rendered checkbox, button, filter, switch, and dialog produces a visible result. If it can't be wired, it isn't rendered.
2. **Every displayed field is written by a form and read by a query.** No write-only fields. No columns nothing renders.
3. **Real foreign keys and database-level uniqueness.** No polymorphic join columns. No application-only duplicate prevention.
4. **One people table.** There is no separate leads, prospects, or subscribers table. Ever.
5. **Marketing and help copy may not claim behavior the code doesn't have.** If a task changes UI capability, check the marketing and help copy in the same task.
6. **No file over 300 lines.** Extract components and modules.
7. **Four states per screen**: loading, empty, error, populated. Empty states name the next action.
8. **No invented metrics.** Only the statuses and events defined in the schema exist. No engagement scores, no open-rate percentages beyond raw counted events.
9. **Every MLS-sourced block renders `<MlsAttribution>`.** No exceptions, including previews and sample pages.
10. **Accessibility**: visible focus rings, 4.5:1 contrast minimum, nothing under 15px carries information, `prefers-reduced-motion` respected.

## Before coding, always

1. Inspect the actual code path. Do not guess file names, field names, or function signatures.
2. Search for an existing utility before writing a new one. Duplicate normalization logic is a defect.
3. Report the files you expect to touch and anything in the task that conflicts with the current code.

Then implement unless there is a genuine blocker.

## Never, without an explicit instruction

- Refactor files unrelated to the task
- Rename existing exports or API routes
- Change the database schema
- Add a dependency
- Resurrect anything in the Rejected Ideas table in `PROJECT_STATE.md`

## Domain rules that are easy to get wrong

- **Never compute or display a loan payoff balance.** The record shows the original deed of trust and whether a reconveyance was filed. Nothing more.
- **Never display a home value estimate**, range, or "your home may be worth."
- **Never assert tax eligibility to a consumer.** Prop 19 eligibility depends on age, disability, or disaster status. Consumer copy states facts; candidate scoring is agent-facing only.
- **Recorded figures carry a document number. MLS figures carry a status and a date.** Never combine them into one number or one sentence.
- Tax rates, cap percentages, and statutory limits live in `config/ca-tax.ts` with an effective date. Never inline them.

## Commands

```
pnpm dev          # local
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest run
pnpm verify:fast  # typecheck + lint + unit tests + file-length + invariants
pnpm verify       # build + typecheck + lint + all tests + file-length + invariants
pnpm db:generate  # write a SQL migration from a schema change
pnpm db:migrate   # apply pending migrations
```

Use `pnpm verify:fast` in the inner loop. Run the full `pnpm verify` once before opening the PR, and before reporting completion. Do not report PASS on unrun checks.

Check `pnpm verify`'s exit code, never filtered output. A grep for success lines will miss a failure that stops the run early.

Schema changes ship as generated SQL files in `drizzle/`, committed in the same PR. Never `drizzle-kit push`. CI builds a scratch database from zero for every run. crm-dev receives migrations only from CI after merge to main.

## Completion report

End every task with the exact format in `docs/templates/completion-report.md`. Nothing else — no prose summary, no explanation of what you learned.

## Who does what

Two coding agents work in this repo. See `docs/AGENT_ROLES.md`.

You are the **builder**: numbered packets (`OR-###`) only, one at a time,
one branch, one PR. Cursor handles copy sweeps, hand edits, and questions
about existing code, and never works while a packet branch is open.

If you are asked to do something with no packet number, ask whether it
should be a packet before starting.
