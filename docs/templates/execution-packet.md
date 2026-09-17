# EXECUTION PACKET

```
TASK: OR-###
BRANCH: feat/<slug>

OBJECTIVE
<One sentence. What must be true when this is done.>

WHY
<The product reason. Tie it to a principle or a validated decision in PROJECT_STATE.md.>

SCOPE
- <files, modules, or surfaces in scope>
- Out of scope: <the adjacent thing Claude will be tempted to touch>

CURRENT BEHAVIOR
<What exists today. If nothing, say "does not exist".>

DESIRED BEHAVIOR
<Observable outcome. Include exact copy for any user-facing string.>

IMPLEMENTATION GUIDANCE
<What must be true, not which lines to edit. Name the architectural
approach, not the file and line number — you do not know the repo
as well as the agent reading it.>

ACCEPTANCE CRITERIA
1. <specific, checkable>
2. <specific, checkable>
3. Existing behavior unchanged
4. pnpm verify passes

DO NOT
- Refactor unrelated files
- Rename existing exports or routes
- Change the schema
- Add dependencies
- Anything in the Rejected Ideas table

BEFORE CODING, REPORT
1. Files you expect to modify
2. Existing utilities or components you intend to reuse
3. Any conflict between this packet and the current code

Then implement unless there is a genuine blocker.

ON COMPLETION
Push the branch, open a PR, and return the completion report format
in docs/templates/completion-report.md. Include the PR number.
```

## Notes for the Director

- The standing invariants in `CLAUDE.md` apply automatically. Do not restate them in the packet.
- Specify *what must be true*, not *which line to edit*. Over-specifying implementation means hallucinating the repo structure.
- One packet, one branch, one PR. If a task needs two branches, it's two packets.
- If the task touches user-facing capability, the packet must include the marketing/help copy check as an acceptance criterion.
