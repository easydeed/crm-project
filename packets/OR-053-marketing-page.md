# OR-053 — Build the marketing page from the audited design

Written by the Director on 2026-10-20, with the merges pre-approved once CI is green. The audit
is OR-052 (docs/audits/OR-052-marketing-design-audit.md).

```
TASK: OR-053
BRANCH: feat/marketing-page

OBJECTIVE
Build / and /sample from docs/claude-design/design_handoff_app_interior/Landing Page v6.dc.html
as the direction, keeping only what the product does, and put it live.

DECISIONS (settled)
1. Archivo is allowed on the marketing page only, bundled with next/font/local, never Google
   Fonts. Update the font allowlist.
2. Gold and cream become tokens with dark values. Darken the gold until every pair it is used
   in passes the floor. Add each pair to tokens.test.
3. Cut everything that is not true: "Text my clients" $9, "Reading it closely", the six counties
   and the county check, "past clients" for MLS imports, "four minutes", crossed-out "Daily
   logins". Hero cards: no listing under a recorded-sale tag, no borrowed figures, no invented
   APNs.
4. Keep "from the county record".

THE USUAL RULES
canonicalFacts() for every figure (add the deed fields to it); the real email, not the mock;
shared button and link classes; 44px targets; 15px text; focus rings; keyboard reachable;
nothing that works only on hover; reduced motion; no dead controls; dark mode.

CHECK GAPS (OR-052 §5), closed here
- An inline style="opacity:…" is not caught by the no-opacity scan.
- A <link> to Google Fonts is not caught by the fonts test.

ACCEPTANCE CRITERIA
1. Full verify, the browser pass, and a desktop comparison in which only home and sample change.
2. New tests proven both ways.
3. PR open, merged when green.
4. The production deploy of main is Ready and / loads at https://crm-project-gamma-seven.vercel.app.

DO NOT
- Touch the database.
```
