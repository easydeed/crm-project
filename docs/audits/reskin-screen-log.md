# Re-skin: which desktop screens each packet changed

The exact record, from OR-030a on. Each row compares fresh desktop captures (1440×900, all 18
screens in `e2e/screens.ts`) of a packet's parent commit and its merge. Every file is rewritten
(`--update-snapshots=all`), the database is reseeded before each capture, and the two sets are
compared byte for byte. Two captures of one build are byte-identical, so a differing file is a real
change.

Before OR-030a the comparison used Playwright's default per-pixel threshold of 0.2, which passes
small colour shifts on anti-aliased text. The "Originally reported" column is what each packet's
report said at the time.

| Packet | Parent → merge | Changed (exact) | Originally reported | Difference |
|---|---|---|---|---|
| OR-028 tokens | 649c4ae → ac3dcb9 | 17 of 18: every screen but unsubscribe | 17 of 18, same list | None. Inter replaced Arial on every app screen, far above the old threshold. |
| OR-029 top bar | ac3dcb9 → e34215d | 17 of 18: every screen but unsubscribe | 17 of 18, same list | None. The bar is on every app screen. |
| OR-029a fonts | e34215d → 1f422fa | 0 | 0 | None. The font files are byte-identical. |
| OR-029a seed | 1f422fa → b550639 | people, people-bulk-bar | people, people-bulk-bar | None. |
| OR-030 dashboard | b550639 → 1f74935 | dashboard, dashboard-call-open, review-queue, start, start-few, start-found, start-nothing | The same seven | None: OR-030 was already measured this way. The 0.2 comparison it replaced passed five of them (review-queue and the four start screens). |

`unsubscribe` (`/u/[token]`) is server HTML with its own CSS and has not changed in any packet.

## How to measure a packet

1. Reseed and set up the local scratch database (`pnpm db:seed`, `pnpm e2e:setup`). The browser run
   changes data on screen (searches, call-list state), so a comparison without a fresh seed reports
   screens that did not change.
2. `pnpm e2e:baseline` on the parent commit's build.
3. Reseed and set up again, then `pnpm e2e:compare` on the changed build.
4. List every failed screen in the report.
