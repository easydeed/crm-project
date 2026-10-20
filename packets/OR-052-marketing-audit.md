# OR-052 — Audit the marketing design (report only)

Asked by the Director on 2026-10-20 and filed after the fact: the audit was first reported in
chat, then filed here as a report-only packet. The report is
docs/audits/OR-052-marketing-design-audit.md.

```
TASK: OR-052
BRANCH: docs/marketing-audit

OBJECTIVE
Report whether docs/claude-design/ holds a design for / and /sample, and if so audit it the
way OR-040 audited the interior, before anything is applied.

SCOPE
- Name the files.
- Audit against docs/ui-spec/01-constraints.md item by item, the tests it would break, tap
  targets, text size, contrast and dark values, and the canonical figures.
- List every feature, price or promise it shows, marked built or not built.
- Report what the live marketing page claims today that is not built.

ACCEPTANCE CRITERIA
1. No file under src/ changed.
2. Every claim is marked built or not built, with where it lives.
3. Ratios and sizes name their values; sizes not measured say so.

DO NOT
- Apply the design.
```
