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

## Shared classes move screens early

`src/app/app/people/ui.ts` holds classes shared across screens (mutedClass, fieldClass, buttonClass,
linkClass, sendCardClass). Changing one moves every screen that uses it, so a screen's baseline can
change in a packet that does not own that screen. That is expected, and each packet lists it.

- OR-030: mutedClass (#3d3d3d to --muted-ink) moved review-queue and the /app/start screens.
- OR-031: fieldClass's input outline moved the /app/start screens. It also reaches the review
  queue's no-parcel panel, which no captured screen shows. The settings forms use their own
  fieldClass (settings/field.ts, OR-034) and did not move.

OR-031's fieldClass change is an accessibility fix that arrived early, not styling that leaked.
The input outline, against the page behind it:

| | Before (foreground at 20%) | After (--border) |
|---|---|---|
| Light | #cfd1d4 on #ffffff, 1.53:1 | #7c879d on #ffffff, 3.61:1 |
| Dark | #373737 on #0a0a0a, 1.66:1 | #6b7487 on #0a0a0a, 4.22:1 |

Same values on every screen it touches (People, the edit form, the review queue's no-parcel panel,
/app/start): the inputs all sit on --background. Floor for a control boundary: 3:1.

`unsubscribe` (`/u/[token]`) is server HTML with its own CSS and has not changed in any packet.

## How to measure a packet

1. Reseed and set up the local scratch database (`pnpm db:seed`, `pnpm e2e:setup`). The browser run
   changes data on screen (searches, call-list state), so a comparison without a fresh seed reports
   screens that did not change.
2. `pnpm e2e:baseline` on the parent commit's build.
3. Reseed and set up again, then `pnpm e2e:compare` on the changed build.
4. List every failed screen in the report.
