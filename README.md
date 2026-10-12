# onrecord

A monthly email to a real estate agent's past clients about their own house, built from California county recorded documents. Plus the three people the agent should call.

**California only. $19/month. One thing, done well.**

---

## Read in this order

| File | What it is |
|---|---|
| `PROJECT_STATE.md` | **Authoritative.** Scope, principles, validated decisions, rejected ideas, open questions. When anything conflicts with this file, this file wins. |
| `CLAUDE.md` | Engineering invariants. Auto-loaded by Claude Code every session. |
| `docs/AGENT_ROLES.md` | Which agent does which work. |
| `BUILD_PLAN.md` | The nine vertical slices and the packets inside each. |
| `SETUP.md` | OR-000. Run this first. |
| `packets/` | Execution packets, one per task. |
| `docs/templates/` | The packet and completion-report formats. |
| `reference/v0-export/` | Design prototype. **Reference only — never edited, never imported from.** |

## The loop

```
Director writes a packet  →  Claude Code inspects, implements, opens a PR
      ↑                                        ↓
Approve / Revise / Block  ←  DIRECTOR_REPORT + CI check
```

Approve on the **PR diff and the CI status**, never on the report alone. A completion report is written by the agent that did the work.

## Commands

```
pnpm dev          # local
pnpm verify:fast  # inner loop: no build, unit tests only
pnpm verify       # build + typecheck + lint + all tests + file length + invariants
pnpm db:generate  # write a SQL migration from a schema change
pnpm db:migrate   # apply pending migrations
pnpm db:seed      # load La Verne fixtures (local database only; it truncates every table)
```

`pnpm verify` must pass before any task is reported complete.

**A fresh seed looks quiet, and that is not a bug.** The seed's dates are fixed, and every window
the product reads is measured from today, so on `pnpm dev` with a fresh seed:
- the call list shows only "Been a while" rows
- the email preview in Settings and on a person's page says "Nothing new on their street this
  month"

The browser pass adds events dated from the run (`pnpm e2e:setup`, from
`src/db/fixtures/e2e-live.ts`), and only those make the call tags and the preview's note appear.
Run `pnpm e2e:setup` after `pnpm db:seed` to see them locally. Moving dates stay out of the seed
by rule (OR-043a).

**The browser pass signs in as fifteen agents, each built for one state** (OR-044a). They live in
`src/db/fixtures/e2e-agents.ts`: the seeded agent (with a send time, so her dashboard is the
scheduled card), the quiet one, and one each for no people, groups, paused, paused by a complaint,
past due, set to end, ended, no plan, a plan Stripe has no record of, Stripe unreachable, extras
on, an admin who clicks View as, and a registered address that is not a login. `pnpm e2e:setup`
builds them and then reads each back through the loaders its screens use; if one no longer shows
its state, setup fails and says which. To capture a new state that only data can produce:
1. Add an agent to the table, with `expects` naming the state.
2. Add a capture with `as: '<key>'` in `e2e/screens/<area>.ts`, whose prepare checks the state's
   own words.
`e2e-agents.test.ts` fails on an agent no capture uses. A state a prepare reaches by clicking must
not write anything another capture reads.

## Two things that will not be compromised

**Plain language.** The buyer is a working agent, median age 57, who already pays for software they don't open. If a sentence makes someone pause for half a second, rewrite it. Jargon inside a picture of a document is evidence; jargon in a sentence is a lost reader.

**Never claim what we don't have.** No home value estimates. No loan payoff balances. No tax eligibility asserted to a consumer. No marketing copy describing behavior the code doesn't have. The entire product rests on its numbers being true.
