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
pnpm db:seed      # load La Verne fixtures
```

`pnpm verify` must pass before any task is reported complete.

## Two things that will not be compromised

**Plain language.** The buyer is a working agent, median age 57, who already pays for software they don't open. If a sentence makes someone pause for half a second, rewrite it. Jargon inside a picture of a document is evidence; jargon in a sentence is a lost reader.

**Never claim what we don't have.** No home value estimates. No loan payoff balances. No tax eligibility asserted to a consumer. No marketing copy describing behavior the code doesn't have. The entire product rests on its numbers being true.
