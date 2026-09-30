# OR-028 — Re-skin: design tokens

```
TASK: OR-028
BRANCH: feat/reskin-tokens

OBJECTIVE
The design tokens from the v0 export, adapted to pass our accessibility
floor, with dark values for every one. No screen changes.

WHY
First re-skin packet. Tokens land alone so every later packet applies a
settled system rather than inventing values as it goes. The export's
palette is light-only and several of its text colors fail contrast, so
this is an adaptation, not a copy.

SCOPE
- src/app/globals.css: extend our existing tokens
- Font loading via next/font
- A contrast test
- Out of scope: every screen. No component markup changes. If a screen
  visibly changes because a token it already uses moved, report it —
  do not restyle anything.

DIRECTOR DECISIONS (settled, build to these)
- Coral and green: keep the export's values for FILLS (tags, badges,
  map parcels) where 3:1 is the bar. Add separate darker variants for
  TEXT that clear 4.5:1 on white. Four tokens: --coral, --coral-text,
  --green, --green-text.
- Fraunces: marketing page only, not the app. Load it, scope it, and do
  not let it into /app or /admin.
- Page background: stays white. #f2f5fa is available as a surface token
  for a section that needs contrast, not as the body background.
- Never copy the export's globals.css. Our file follows the OS dark
  preference; theirs is light-only.

DESIRED BEHAVIOR

1. Read the token values from the audit report (docs/audits/
   OR-027-v0-audit.md §2) and the export itself. Bring across: the
   palette, the radius scale, the border-over-shadow card treatment,
   and the spacing scale where it differs from ours.

2. Every token gets a dark value. A token with no dark counterpart is
   a bug — the app follows the OS preference and always has.

3. Contrast test. A unit test that computes the contrast ratio for
   every foreground/background token pair we actually use, and fails
   the build below the floor: 4.5:1 for text, 3:1 for large text and
   non-text (borders, icons, fills). Run it against both light and dark.
   Report any pair you had to adjust and by how much.

4. Fonts via next/font. Inter for the app, Fraunces for marketing only.
   No new npm dependency — next/font is already available. A source
   test fails the build if the Fraunces variable appears under
   src/app/app/ or src/app/admin/.

5. The email is untouched. src/digest/ has its own design — serif,
   cream, the oxblood stamp — and 12px text is correct there. A source
   test fails the build if an app token is imported into src/digest/.

6. Report every token you added, its light and dark value, its contrast
   ratio against the surface it sits on, and where it comes from in the
   export.

ACCEPTANCE CRITERIA
1. Every new token has a light and a dark value
2. The contrast test passes and fails the build when a token is
   deliberately darkened below the floor — prove it by breaking one,
   watching CI go red, and reverting
3. Fraunces does not appear under src/app/app/ or src/app/admin/,
   enforced by a source test
4. No app token is imported into src/digest/, enforced by a source test
5. No dependency added
6. The browser pass still passes 37/37 at both widths
7. The desktop pixel baselines are recaptured, and the report says
   which screens changed and why
8. pnpm verify passes, CI green before merge

DO NOT
- Copy the export's globals.css
- Change any component markup
- Touch src/digest/
- Add a dependency
```
