# Agent roles

Two coding agents work in this repo. This file is the contract between them. Both read it. Neither invents its own job.

**The Director** (a separate Claude conversation, holding product context) writes packets, reviews reports, and decides what happens next. Neither coding agent decides scope.

---

## The division

| | Claude Code | Cursor |
|---|---|---|
| **Role** | Builder | Editor |
| **Does** | Numbered packets (`OR-###`) | Sweeps, hand edits, exploration |
| **Works on** | A feature branch, one packet at a time | `main`, or a short-lived `chore/` branch |
| **Ends with** | A PR and a `DIRECTOR_REPORT` | A `SWEEP_REPORT` |
| **Scope** | Exactly what the packet says | Exactly what the human asked |

**The rule that prevents every collision: only one agent works at a time.** Not one per branch — one, period. Finish, merge or park, then start the other.

---

## Claude Code — the builder

Everything with a packet number. `packets/OR-###-*.md` is the whole instruction.

- One packet, one branch, one PR.
- Read `PROJECT_STATE.md` and `CLAUDE.md` before every task. They are authoritative.
- Inspect before implementing. Never guess a file name, field name, or signature.
- Report before coding: files you expect to touch, any dependency you want to add and why, any conflict between the packet and the current code.
- Run `pnpm verify` and report only what you actually ran. `NOT PROVEN` is a valid answer and is always better than a guessed `PASS`.
- Return the `DIRECTOR_REPORT` from `docs/templates/completion-report.md`. Nothing before it, nothing after it.

**Never:** work outside the packet's scope, refactor unrelated files, resurrect anything in the Rejected Ideas table, or start a second packet before the first is merged.

**Parallel worktrees:** available, not yet in use. Both sessions would share one crm-dev database, and the constraint tests seed and assert against it. Serial until each worktree has its own database branch.

---

## Cursor — the editor

Everything without a packet number. Human-directed, human-watched, usually short.

Typical work:
- The plain-language copy sweep
- Reading a diff and asking questions about it
- Harvesting a component out of `reference/v0-export/` into `src/` when a packet calls for it
- One-line fixes, typos, a stray console.log
- "Where does X happen in this codebase?"

Rules:
- Never start work while a packet branch is open and unmerged.
- Never change the schema, `ca-tax.ts`, `PROJECT_STATE.md`, `CLAUDE.md`, or `BUILD_PLAN.md`. Those move by packet or by the human.
- Never add a dependency.
- Never touch `reference/v0-export/` — read only.
- Run `pnpm verify` before reporting done, same as anyone.
- If a task turns out to need real architectural decisions, stop and say so. It's a packet, not a sweep.

**Report format:**

```
SWEEP_REPORT
What: <one line>
Files: <list>
Verify: PASS | FAIL
Notes: <anything the Director should know, or "none">
Commit: <hash>
```

---

## Which is which, in practice

| Task | Goes to |
|---|---|
| `OR-004` address matcher | Claude Code |
| Rewriting "Loan reconveyed" everywhere | Cursor |
| Lifting `<ParcelMap>` out of the v0 export | Cursor, if a packet asked for it |
| Anything that adds a table | Claude Code, via packet |
| "Why does the send job run twice?" | Cursor |
| Fixing what that investigation found | Claude Code, via packet |

The line: **Cursor changes what something says. Claude Code changes what something does.** When a sweep starts changing behavior, it should have been a packet.
