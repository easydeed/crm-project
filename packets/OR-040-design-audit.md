# OR-040 — Audit the Claude design handoff

Written by the Director and handed to the builder to build as written. The report is
docs/audits/OR-040-claude-design-audit.md.

> Framing (Director): same shape as OR-027 with the v0 export. The difference is that this
> designer had docs/ui-spec/01-constraints.md, so the audit is also a test of the handoff
> document. Do not soften a violation because the design is good-looking.

```
TASK: OR-040
BRANCH: chore/design-audit

OBJECTIVE
Read the new design at docs/claude-design/design_handoff_app_interior
and report exactly what it proposes and what it would break. No code
changes.

SCOPE
- Read the handoff and report
- Out of scope: any change to src/, any application of the design

REPORT
1. What it is
2. Against 01-constraints.md, item by item
3. Against the tests (name every one, as OR-027 did)
4. Against the browser checks (judge against the rule as written, and
   say where the current check's answer differs)
5. Contrast (light and dark, computed ratios; flag missing dark values)
6. Copy (fixed strings reworded, moved, muted, shrunk, or hidden)
7. Did the constraints document work? (clearly / ambiguously / not
   covered, for every violation)
8. Recommendation (take / take with changes / refuse; packet sequence)

ACCEPTANCE CRITERIA
1. Every section answered with specifics and quotes, not summaries
2. No file under src/ changed
3. Section 7 is answered for every violation
4. The report names actual values, files and line references

DO NOT
- Change any code
- Begin applying the design
- Soften a violation because the design is good-looking
```
