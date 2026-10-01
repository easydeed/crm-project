# Re-skin: which desktop screens each packet changed

The exact record, from OR-030a on. Each row compares fresh desktop captures (1440×900, all 18
screens in `e2e/screens.ts`) of a packet's parent commit and its merge. Every file is rewritten
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

OR-031's fieldClass change is an accessibility fix that arrived early, not styling that leaked.
The input outline, against the page behind it:

| | Before (foreground at 20%) | After (--border) |
|---|---|---|
| Light | #cfd1d4 on #ffffff, 1.53:1 | #7c879d on #ffffff, 3.61:1 |
| Dark | #373737 on #0a0a0a, 1.66:1 | #6b7487 on #0a0a0a, 4.22:1 |

Same values on every screen it touches (People, the edit form, the review queue's no-parcel panel,
/app/start): the inputs all sit on --background. Floor for a control boundary: 3:1.

`unsubscribe` (`/u/[token]`) is server HTML with its own CSS and has not changed in any packet.

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

- **Inline copies of linkClass's string (raised in OR-033a).** There were 21 copies outside /admin.
  OR-034 fixed its six (settings and billing); 15 remain.
  linkClass is `text-[15px] underline underline-offset-4` plus the focus ring. None is colour debt:
  every copy draws in the same colour.
  - "Identical": the string is linkClass's, letter for letter.
  - "+mt-6": linkClass plus a margin. It becomes `` `${linkClass} mt-6` ``, as OR-032 and OR-033 did.
  - "no 15px": the copy lacks `text-[15px]`. It sits inside 15px text, so swapping it moves
    nothing. Check that before the swap.
  - The rest are deliberate variants. Keep them as variants, or build them on linkClass. Don't
    flatten them.

  | Owner | File | Differs from linkClass |
  |---|---|---|
  | OR-035 | app/start/error.tsx (two links) | "tap" variant, no 15px |
  | OR-035 | app/people/import/import-result.tsx:5 | adds `inline-block` |
  | OR-035 | app/people/import/import-result.tsx:43 | a `<summary>`: adds `cursor-pointer`, no 15px |
  | OR-036 | login/page.tsx | identical |
  | OR-036 | register/page.tsx | identical |
  | final sweep | app/error.tsx | +mt-6 |
  | final sweep | app/home-card.tsx | identical |
  | final sweep | app/layout.tsx ("Log out") | adds `text-foreground focus-visible:outline-foreground` |
  | final sweep | app/text-notice.tsx (a local `linkClass`) | no 15px |
  | final sweep | app/people/error.tsx | +mt-6 |
  | final sweep | app/people/[id]/error.tsx | +mt-6 |
  | final sweep | app/people/[id]/not-found.tsx | "tap" variant |
  | final sweep | sample/page.tsx | identical |
  | final sweep | home-story.tsx | identical |

  Not copies, and left out of the table:
  - import-form.tsx's selected tab underlines a tab; it is not a link.
  - view-as-banner.tsx is exempt (white on INK_COLOR).
  - /admin stays unstyled.

- **Copies of buttonClass's string (raised in OR-034).** Three remain outside /admin, all on
  `<Link>`s, which never take a disabled state. `src/app/shared-classes.test.ts` lists them and fails
  both ways.
  - app/home-card.tsx and app/home-billing-card.tsx: dashboard links styled as buttons. They add
    `mt-6 inline-block` and lack the focus colour. Final sweep.
  - home-story.tsx: the marketing page. It adds `inline-block`. Final sweep, with its linkClass copy.

## How to measure a packet

1. Reseed and set up the local scratch database (`pnpm db:seed`, `pnpm e2e:setup`). The browser run
   changes data on screen (searches, call-list state), so a comparison without a fresh seed reports
   screens that did not change.
2. `pnpm e2e:baseline` on the parent commit's build.
3. Reseed and set up again, then `pnpm e2e:compare` on the changed build.
4. List every failed screen in the report.
