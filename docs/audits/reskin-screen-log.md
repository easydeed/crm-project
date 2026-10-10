# Re-skin: which desktop screens each packet changed

The exact record, from OR-030a on. Each row compares fresh desktop captures (1440×900, every screen in
`e2e/screens.ts`: 18 until OR-036 added /login and /register, signed out, for 20; 23 from OR-038, which added /, /sample and /sample's plain text in dark mode) of a packet's parent commit and its merge. Every file is rewritten
(`--update-snapshots=all`), the database is reseeded before each capture, and the two sets are
compared byte for byte. Two captures of one build are byte-identical, so a differing file is a real
change.

Before OR-030a the comparison used Playwright's default per-pixel threshold of 0.2, which passes
small colour shifts on anti-aliased text. The "Originally reported" column is what each packet's
report said at the time.

Every packet so far re-measured exactly and matched its original report. The undercount was a real
hole, but these packets' changes (Inter replacing Arial, a divider on every screen) sat well above the
old threshold. OR-030's five muted-text screens are the change it would have hidden.

| Packet | Parent → merge | Changed (exact) | Originally reported | Difference |
|---|---|---|---|---|
| OR-028 tokens | 649c4ae → ac3dcb9 | 17 of 18: every screen but unsubscribe | 17 of 18, same list | Re-measured exactly; matches. Inter replaced Arial on every app screen, far above the old threshold. |
| OR-029 top bar | ac3dcb9 → e34215d | 17 of 18: every screen but unsubscribe | 17 of 18, same list | Re-measured exactly; matches. The bar is on every app screen. |
| OR-029a fonts | e34215d → 1f422fa | 0 | 0 | Re-measured exactly; matches. The font files are byte-identical. |
| OR-029a seed | 1f422fa → b550639 | people, people-bulk-bar | people, people-bulk-bar | Re-measured exactly; matches. |
| OR-030 dashboard | b550639 → 1f74935 | dashboard, dashboard-call-open, review-queue, start, start-few, start-found, start-nothing | The same seven | Re-measured exactly; matches. OR-030 was already measured this way. The 0.2 comparison it replaced passed five of them (review-queue and the four start screens). |
| OR-031 People | 2a9ff1c → fd469f2 | people, people-bulk-bar, person-detail, start, start-few, start-found, start-malformed, start-nothing | Measured exactly | People's own three, plus the five /app/start screens through the shared fieldClass (see below). review-queue did not change: its captured state shows no fieldClass input. |
| OR-032 review queue | 41d5940 → 8a06bdd | review-queue | review-queue only | The card outline (--border, the documented exception to --rule) and the "Name matches" tag. The linkClass swap in review-queue.tsx and error.tsx moved nothing; the error screen is not captured, and its classes are the same set in a different order. |
| OR-033 add-ons | c3b8e86 → 429ef0b | addons, addons-lender-form | addons and addons-lender-form only | Row divider (--rule), muted row and band notes, the bill bar's divider and note at full strength. addons-lender-form also shows the config inputs on the shared fieldClass (outline 2.56:1 to 3.61:1 light). The error screen's linkClass swap is not captured. |
| OR-033a disabled state | 4652436 → 5a33730 | import, people-bulk-bar, start, start-few, start-found, start-malformed, start-nothing | Not predicted; measured | Each diff is one button-sized box, and no screen changed size (the ring is inset). import and the five start screens: the import form's "Import", disabled until there is a file. people-bulk-bar: "Add to group" and "Remove from group", disabled with no groups. Disabled now reads as --surface, --muted-ink and a --border ring instead of 60% opacity. |
| OR-034 settings and billing | 7d45063 → 0cc5c9d | settings | settings only | The details, appearance and sending inputs on the shared fieldClass (--border, 1.53:1 to 3.61:1 light), and Muted helper lines in --muted-ink. One region, and the page keeps its size. The read-only email field still shows no border. billing and billing-cancel are byte-identical: their buttonClass and linkClass copies differed only in focus colour and disabled state, and neither is captured. |
| OR-035 start and import | 0e6e759 → 06e79ed | import, start, start-few, start-found, start-malformed, start-nothing | The same six | No page changed size. import, start and start-nothing: one region, the drop zone (dashed --border, 1.96:1 to 3.61:1 light) and the file input outline (--border). start-few and start-found also take the closings list dividers (--rule). start-malformed also takes the where-to-find panel edge (--rule). The skeleton is not captured. The framing sentences did not move. |
| OR-036 sign in and create account | 57244ab → 9179033 | login, register (of 20) | login and register only | The parent is OR-036's capture-only commit, so both screens have a real before. Each diff is confined to the inputs: the shared fieldClass outline (--border, 1.53:1 to 3.61:1 light). No page changed size. The other 18 screens are byte-identical. |
| OR-037 final sweep | 477521e → e3b2fb6 | login, register, settings, people, people-bulk-bar, person-detail (of 20) | settings, login, register, person-detail; "any other screen Decision B moves" | login and register: the new <h1> moves the form down. The rest is fieldClass becoming a block, so labels sit above their inputs: settings +225px, people and people-bulk-bar +22px (Search), person-detail +22px (Group name). person-detail was predicted for the email preview, but the seeded person has no note this month, so no preview frame is captured. The preview fix (dark mode) is in no capture. dashboard is byte-identical. |
| OR-038 marketing | 62b765e → cb9a03a | home (of 23) | home only; sample and sample-text-dark byte-identical | The parent is OR-038's capture-only commit, so all three new screens have a real before. One region, x 447–971, y 208–696: the <h1> in Fraunces 500 at 40px wraps to two taller lines, and the column is centred vertically, so the wordmark rises and the story, button and links move down. No words, colours or controls changed. sample-text-dark puts the OR-037 dark-mode fix in a capture, and its prepare step fails if the plain text sits on white (tried on a fresh build). **The re-skin is complete.** |
| OR-041 property checks | c7f104a → 3fb2489 | 0 (of 23) | 0 | Not a re-skin. `.tap` applies under 640px only, so 1440 is byte-identical. At 390, 11 kinds of standalone link went from 19 to 39px to 44px tall on 10 screens: home, sample, sample-text-dark, login, register, dashboard, dashboard-call-open, people, billing, billing-cancel. People row links stay 19px, an owned exception for OR-045. |
| OR-042 system tokens | 636a70b → 7604d58 | 24 (of 25): every screen but unsubscribe | nearly all 23, plus the two new dark captures | The parent is OR-042's capture-only commit, which added dashboard-dark and addons-dark, so both have a real before. Primary buttons and fields grow to 48px and 17px, text links turn blue, tags take the chip shape, and the darker --rule shows on every divider. addons-dark: the bill bar goes from #ededed (it inverted) to navy #202b4f. unsubscribe has its own CSS and is byte-identical. |
| OR-043 chrome | 4a9d7dc → 360660d → 91ba355 | Tags: dashboard, dashboard-dark, dashboard-call-open. Chrome: 21 (of 27), every /app screen | Tags: the dashboard screens. Chrome: every /app screen; login, register, home, sample, sample-text-dark and unsubscribe byte-identical | Measured in two steps from the capture-only first commit, which added dashboard-quiet and dashboard-quiet-dark. Tags (c2): the three dashboard screens grow 45px, from "Been a while" rows to "Big sale next door", "Paid off their loan" and "Taxes worth a talk"; the quiet captures are byte-identical. Chrome (c3): the navy bar with the light current-page pill, and the name · brokerage line with Log out under it; each page is 13px taller than with the old Log out line. The six signed-out screens are byte-identical. The view-as banner is in no capture (the seed has no admin). |
| OR-043a fixture dates | 77ab0ff → b9729e9 | settings, person-detail (of 27) | settings and person-detail only | Not a re-skin. Both screens previewed a skipped note ("Nothing new on their street this month") in every capture until now. With live Bonita Ave sales they preview Aisha Rahman's note. settings: the email frame, scrolled into view so it paints (+413px). person-detail: the whole note as plain text, street sales and document numbers included (+859px). Step 0 of the procedure was run for the first time: three fresh-seed captures of b9729e9, the third run after the first two matched, were byte-identical, 27 of 27, all three sets hashing d8b2ec5161a8829a. |
| OR-044 dashboard | 22177a6 → 1dd0fea | dashboard, dashboard-dark, dashboard-quiet, dashboard-quiet-dark, dashboard-call-open (of 27) | The same five | Step 0 first: three fresh-seed captures of 1dd0fea, the third after the first two matched, byte-identical 27 of 27, all hashing d25d33c414930264. The call list and homeowners become panels with a --surface strip, rows are ranked in ink, Call is the secondary button, and the open call panel is a two-column table. The column grows to 760px. dashboard +110px, quiet +104px, call-open +80px. Dark follows from the tokens. The send card's Preview/Skip swap is in no capture: the seeded agent's card is in the "Set when the note goes out" state. The other 22 screens are byte-identical. |
| OR-045 People and person | ffe6696 → a7cdded | people, people-bulk-bar, person-detail (of 27) | The same three | Step 0 failed first, on settings, a screen this packet doesn't touch: two fresh-seed captures of 0ba00a5 differed, one catching the email preview laid out about 60px wide before its frame took its width. The race was in OR-043a's showNote; it now waits for the email to fill the frame and for two identical frame shots. Re-run: three captures of a7cdded, the third after the first two matched, byte-identical 27 of 27, all hashing d623f9906c89d8fb. People: one panel with Search and the filter chips in its strip, ruled rows with ink names and 44px Edit links (-169px). people-bulk-bar: the navy bar with pill controls (-72px). person-detail: the details table and the On the record, Add to group and preview panels (+34px). The other 24 are byte-identical. |
| OR-046 settings, billing, cancel, add-ons | b804dcc → a0dc4f5 | settings, billing, billing-cancel, addons, addons-dark, addons-lender-form (of 27) | The same six | Step 0: three fresh-seed captures of a0dc4f5, the third after the first two matched, byte-identical 27 of 27, all hashing 9b31fad959fcd936. settings: five panels with strips and the preview as its own panel under the form, 600px with Desktop (+229px). billing: the plan table flush in its panel, statuses as words, the invoices panel. billing-cancel: one plain panel. addons and addons-dark: the Extras panel, 56x32 switches, the bill bar at 17/22px on the bar pair. addons-lender-form +80px. The other 21 are byte-identical. |

## Shared classes move screens early

`src/app/app/people/ui.ts` holds classes shared across screens (mutedClass, fieldClass, buttonClass,
linkClass, sendCardClass). Changing one moves every screen that uses it, so a screen's baseline can
change in a packet that does not own that screen. That is expected, and each packet lists it.

- OR-030: mutedClass (#3d3d3d to --muted-ink) moved review-queue and the /app/start screens.
- OR-031: fieldClass's input outline moved the /app/start screens. It also reaches the review
  queue's no-parcel panel, which no captured screen shows. The settings forms use their own
  fieldClass (settings/field.ts, OR-034) and did not move.
- OR-033a: buttonClass's disabled state (disabledClass) moved every captured screen that shows a
  disabled button: import, the five /app/start screens and people-bulk-bar.
- OR-037: fieldClass became a block, which moved settings, people, people-bulk-bar and person-detail.
  It also reaches the uncaptured person edit form, the review queue's no-parcel panel and the group forms.

OR-031's fieldClass change is an accessibility fix that arrived early, not styling that leaked.
The input outline, against the page behind it:

| | Before (foreground at 20%) | After (--border) |
|---|---|---|
| Light | #cfd1d4 on #ffffff, 1.53:1 | #7c879d on #ffffff, 3.61:1 |
| Dark | #373737 on #0a0a0a, 1.66:1 | #6b7487 on #0a0a0a, 4.22:1 |

Same values on every screen it touches (People, the edit form, the review queue's no-parcel panel,
/app/start): the inputs all sit on --background. Floor for a control boundary: 3:1.

`unsubscribe` (`/u/[token]`) is server HTML with its own CSS and has not changed in any packet.

## A decorative token on a boundary you act on

Twice now a debt note has said `--rule`, the decorative divider, for a boundary that tells someone
where to act: OR-032's candidate cards and OR-035's drop zone. Both took `--border` instead. The
test is whether the boundary marks something to act on. A list divider is decoration; the edge of
a card with its own "This one" button, or of a drop target, is not. The rule under both: a token
swap must not make something fainter than it is today. For the same reason, OR-035's skeleton rows
took `--rule` rather than the note's `--surface`, which would have vanished.

## Found, not fixed

Items a packet found that are not colour debt and that no packet owns. Each stays here until a
decision closes it.

- **Assessor facts shown without their source (raised in OR-032).** The review queue's candidate
  cards show beds, baths and sq ft from the assessor roll (`parcels`) with no source label.
  PROJECT_STATE principle 3 asks that every figure be legible as county record or MLS. The same
  figures appear unlabelled in the digest's four-doors-down comparison
  (`src/digest/blocks/four-doors.ts`): "That listing" is followed by its MLS attribution, while
  "Your house", from the assessor roll, carries none. So this is a product question about how
  assessor data is labelled everywhere, not one screen's copy. It is not colour debt, and no
  packet owns it.

- **Closed in OR-037, the final sweep.** Each item is enforced now, not just listed:
  - The 21 inline linkClass copies and the six buttonClass copies are gone. shared-classes.test.ts
    checks the whole tree for both. The buttonClass list is empty. The linkClass list holds only
    the exempt view-as banner.
  - Both auth pages have an `<h1>` ("Sign in", "Create your account").
  - Labels sit above their inputs everywhere: fieldClass is a block.
  - The tokens-only scan covers all of src/app. Widening it found two things the directory list had
    hidden:
    - src/app/digest/preview-panel.tsx drew its plain-text email preview as #ededed on white in dark
      mode (1.17:1), on four screens. Fixed.
    - /admin carried table borders in eight files that the "permanent" entries never recorded. They
      are listed now.

- **The marketing page does not answer the comprehension test (raised in OR-038).** PROJECT_STATE
  validation 3 expects "it tells me who to call" after ten seconds on the page. The page talks
  about the note and the tax difference and never mentions the call list. The Director's "who to
  call" hero rewrite exists and has not shipped. This is a copy decision for Jerry, not a re-skin
  one. OR-038 changed no words.

- **No privacy policy or terms page (raised in OR-038). No owner; flagged for Jerry.** Register
  collects names, emails and phone numbers, and neither page exists in src/app. In California this
  is a CCPA question, not only a missing page. src/app links to neither page, so there is no dead
  link today. The export's footer links to both, and that is why OR-038 took no footer. Nothing
  may link to these pages, and no support or privacy address may be invented, until they exist.

What remains open: the unlabelled assessor facts, the comprehension gap and the missing privacy
and terms pages, all product decisions recorded above.

## How to measure a packet

0. Before trusting any comparison, check that a capture reproduces (OR-043a):
   - Capture one commit three times, each from a fresh seed and setup.
   - Run the third only after the first two have matched.
   - All three sets must be byte-identical.
   - A screen that differs between runs is unstable, and a comparison can't tell its change from
     noise. The usual cause is a tie broken by a random id: rows made at run time get random
     ids, while the seed's are fixed.
1. Reseed and set up the local scratch database (`pnpm db:seed`, `pnpm e2e:setup`). The browser run
   changes data on screen (searches, call-list state), so a comparison without a fresh seed reports
   screens that did not change.
2. `pnpm e2e:baseline` on the parent commit's build.
3. Reseed and set up again, then `pnpm e2e:compare` on the changed build.
4. List every failed screen in the report.

**Take the baseline and the comparison on the same day.** Some screens print text measured from
today, so two captures on different days differ with no code change:
- "You've owned it N years and M months" changes on the 1st.
- The call list is built for the current month.
- The previews print the live sales' recorded dates, which move every day.

A comparison run either side of midnight, and above all midnight on the 1st, reports changes the
code didn't make.
