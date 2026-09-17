# COMPLETION REPORT

Return exactly this. No prose before or after.

```
DIRECTOR_REPORT
Task: OR-###
Status: PASS | PARTIAL | BLOCKED
Branch: feat/<slug>
PR: #<number>

Changed:
- <path>
- <path>

Reused:
- <existing utility or component, or "none">

Validation:
- Typecheck: PASS | FAIL
- Lint: PASS | FAIL
- Tests: <n>/<n> PASS
- File length: PASS | FAIL
- Invariants: PASS | FAIL

Acceptance criteria:
1. <criterion>: PASS | FAIL | NOT PROVEN
2. <criterion>: PASS | FAIL | NOT PROVEN

Risks / follow-up:
- <or "none">

Commit: <hash>
```

**Report only what you actually ran.** `NOT PROVEN` is a valid and expected answer. Reporting PASS on an unrun check is the one unrecoverable failure in this process.

---

# DIRECTOR REVIEW

The Director responds with exactly one of three, after reading the **PR diff and the CI check status** — not the report alone.

```
APPROVED
Task OR-### complete. Merge and proceed to OR-###.
```

```
REVISION REQUIRED
Issue: <which acceptance criterion is unmet or unproven>
Instruction: <the narrowest possible next action>
Do not make additional code changes unless the fix requires them.
```

```
BLOCKED
Reason: <what makes this undoable as specified>
Decision needed: <the question only the human can answer>
```

## Why CI status matters

A completion report is written by the agent that did the work. `Tests: 312/312 PASS` in a report is a claim, not evidence. The GitHub Actions check on the PR is evidence, because the agent can't author it. Approve on the check, not the claim.
