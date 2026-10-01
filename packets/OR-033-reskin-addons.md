# OR-033 — Re-skin: add-ons

Drafted by the builder. Approved by the Director with Decision A as defaulted.
The disabled-opacity finding becomes OR-033a, run after OR-033 and before OR-034.

```
TASK: OR-033
BRANCH: feat/reskin-addons

OBJECTIVE
/app/addons restyled with the OR-028 tokens. Same bands, rows, switch,
config form and bill. Clears the four add-on debt files.

WHY
A row that is off must read as "switched off", never "unavailable".
OR-021 built that, and the test that holds it is the one this packet
must leave exactly as it is: rows render identically on and off, apart
from the switch. The export breaks it with a badge that changes colour
when a row is off.

SCOPE
- addon-row.tsx: the row divider and the row note (debt)
- addons-panel.tsx: the band note (debt)
- addon-config-form.tsx:
  - the input outline (debt): its local inputClass becomes fieldClass
  - KEEPS_SETTINGS (debt)
- bill-bar.tsx: the divider and the closing note (debt; Decision A)
- error.tsx: the inline copy of linkClass becomes linkClass
- src/app/design-debt.test.ts: delete the four entries
- addons-ui.test.ts: new assertions only. The five existing tests stay
  exactly as they are, the on/off test above all.
- Out of scope:
  - addon-switch.tsx: already tokens only, and the one part of a row
    allowed to differ. No edit.
  - actions.ts, row-data.ts copy, src/addons/*
  - the config form's submit button (see "Found, not absorbed")

CURRENT STATE (read from the code)
- Two bands, "Extras" and "Texting your clients". Texting has a
  carrier note in text-foreground/80.
- Each row shows:
  - title, summary, blurb and price
  - an optional row note in text-foreground/80
  - the switch on the right
  The row's bottom divider is border-foreground/20.
- The switch is a role="switch" button in --foreground with the word On
  or Off. The test renders a row on and off, strips the switch, and
  requires the rest to be byte-identical, with no opacity, no
  text-foreground/ and no "disabled".
- The config form has its own inputClass: fieldClass with
  border-foreground/40, which is 2.56:1 on white (under 3:1) and 3.40:1
  dark. KEEPS_SETTINGS is text-foreground/80. Its submit button repeats
  buttonClass's string without disabled:opacity-60.
- The bill bar is inverted: bg-foreground with text-background. Its
  divider above the total is border-background/40 (3.81:1 light, 2.66:1
  dark). The "Changes take effect…" note is text-background/80 (11.70:1
  light, 10.17:1 dark).

DESIRED BEHAVIOR

1. Debt:
   - row divider: --rule (decorative, as the debt table says)
   - row note, band note and KEEPS_SETTINGS: mutedClass (--muted-ink,
     already in the contrast test on --background)
   - config form inputs: fieldClass, the shared class. That removes a
     duplicate and lifts the outline from 2.56:1 to 3.61:1 light (4.22:1
     dark). Only the outline changes.
   - the bill bar: Decision A
   - all four debt entries are deleted

2. DECISION A — the bill bar stays inverted, at full strength. APPROVED:
   keep it inverted.
   - The bar keeps bg-foreground and text-background. That pair is in
     the contrast test (17.90:1 light, 16.91:1 dark).
   - The divider becomes border-background, and the note becomes
     text-background. No opacity, so nothing on the bar needs a pair
     the test doesn't check.
   - Why keep it inverted: the bill is the one thing the switches
     change. It should look like the answer to the page, and it already
     does. The export does the same (bg-ink).
   - Why not mute the note: the token system has no muted ink for the
     inverted bar. Inventing one for a single line is more system than
     the line is worth.
   - The alternative is a --surface bar: --foreground text, --rule
     divider, the note in mutedClass (muted-ink on surface is the 4.56:1
     pair). It is lighter and every pair is already checked, but it
     loses the bar's weight. Say "surface" if you prefer it.

3. linkClass replaces the error screen's inline copy. Same classes, so
   nothing moves.

4. What we do not do, each for a reason:
   - The export's icon badge, blue when on and blue-soft when off
     (addon-extra-row.tsx:25). It makes an off row look unavailable,
     the OR-021 failure. Its off state is also blue text on --blue-soft,
     which we never do.
   - A blue switch. --blue is used nowhere in /app yet. Introducing it
     on one control is a system decision, not a screen one. The switch
     stays --foreground, says On or Off in words, and is untouched.
   - The export's aria-label, "Turn X off/on". It puts the state in the
     name. Ours names the add-on and lets aria-checked carry the state.
   - The toast on toggle. The bill moving is the confirmation.

ACCEPTANCE CRITERIA
1. All five addons-ui.test.ts tests pass unchanged. They cover:
   - on and off identical apart from the switch, with no opacity or
     muted colour, and ">Off<"
   - the empty state
   - bands, the carrier note and the bill
   - assertWritable
   - four states
2. New assertions:
   - the bill bar's section is exactly bg-foreground text-background,
     and that pair is in tokens.test PAIRS
   - the config form uses fieldClass and defines no input class of its
     own
   - the row note, band note and KEEPS_SETTINGS use mutedClass
   - error.tsx uses linkClass, not a copy of its string
3. design-debt.test.ts: the four add-on entries and the OR-033 owner are
   deleted, and the /app scan passes
4. The contrast test passes unchanged
5. The browser pass is 37/37 at both widths
6. The desktop comparison (exact, OR-030a), from a fresh seed, lists
   every changed screen. Expected: addons and addons-lender-form only.
7. reskin-screen-log.md gains the OR-033 row
8. No dependency, no schema change, no copy change, no test loosened
9. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - The export's badge: an icon square in the row whose class depends
     on `enabled` (bg-blue when on, bg-blue-soft text-blue when off).
     The existing on/off test goes red. This proves the OR-021 test
     still holds after the restyle. A new test would prove nothing.
   - The bill note back to text-background/80: design-debt.test.ts goes
     red as new debt, and nothing else. This proves a cleared entry
     cannot quietly come back. It is the first break in the re-skin to
     test that direction.
10. pnpm verify passes, CI green before merge

DO NOT
- Make anything in a row but the switch depend on whether it is on
- Dim, mute or grey an off row in any way
- Change the switch, its words, its aria, or the actions
- Change the bill's arithmetic or its copy
```

## Found while drafting, not absorbed (now OR-033a)

- **`disabled:opacity-60` on button classes.** The standing rule is
  "never opacity to show state". Seven button class strings in /app
  show the disabled state with `disabled:opacity-60`:
  - `buttonClass` and `destructiveButtonClass` (people/ui.ts)
  - call-entry.tsx
  - settings/save-button.tsx
  - import-form.tsx
  - login-form.tsx and register-form.tsx

  Most predate the re-skin. `destructiveButtonClass` is mine: I copied
  the suffix from buttonClass in OR-031 without checking it against the
  rule. These are not colour debt, so design-debt.test.ts does not see
  them.

  The fix belongs in the shared class, so it moves every screen. It
  also needs a decision on what disabled looks like without opacity:
  - --surface fill with --muted-ink text and a --border outline, or
  - cursor-not-allowed plus aria-disabled and no visual change.

  That is a cross-cutting packet, not OR-033's. The config form's own
  submit button keeps its string here for the same reason: switching it
  to buttonClass would add the opacity, not remove it.
