# OR-030a — Exact desktop comparison

Drafted by the builder, approved by the Director with the two amendments at
the end.

```
TASK: OR-030a
BRANCH: fix/exact-desktop-compare

OBJECTIVE
The desktop comparison fails on any pixel change, and a recapture always
rewrites every baseline. Correct the changed-screen counts recorded for
OR-028, OR-029 and OR-029a.

WHY
Playwright's default per-pixel threshold (0.2) passed the review queue
and /app/start after OR-030 changed their muted text from #3d3d3d to
#63708a. --update-snapshots (mode "changed") rewrites only screens that
fail, so baselines can be older than they look. Every screen packet
from here reports its changed screens from this check.

SCOPE
- e2e/desktop-unchanged.spec.ts: exact comparison
- package.json: two scripts, no dependency
- A source test that fails if the comparison stops being exact
- docs/audits/reskin-screen-log.md: new, the exact per-packet record
- Out of scope:
  - running the pixel comparison in CI (still on-demand and
    same-machine: cross-machine rendering is not byte-stable)
  - the mobile project, which asserts layout rules, not pixels

CURRENT STATE (read from the code)
- desktop-unchanged.spec.ts calls toHaveScreenshot with no options, so
  threshold 0.2 and maxDiffPixels 0 apply.
- The spec's comment says "capture ... with --update-snapshots", with no
  mode.
- package.json has "e2e" and "e2e:setup" only.
- The changed-screen counts live only in the PR descriptions of #41 and
  #42 and in the completion reports, not in the repo.

DESIRED BEHAVIOR

1. The comparison is exact: toHaveScreenshot(name, { fullPage: true,
   animations: 'disabled', threshold: 0, maxDiffPixels: 0 }). The spec's
   comment explains why: 0.2 hides colour shifts on anti-aliased text.

2. Two scripts, so nobody has to remember the flags:
   - "e2e:baseline": PW_DESKTOP_COMPARE=1 playwright test
     --project=setup --project=desktop --update-snapshots=all
   - "e2e:compare": the same, without --update-snapshots
   The spec's comment names both.

3. Source test (vitest, reads the spec and package.json):
   - the spec passes threshold: 0 and maxDiffPixels: 0
   - the baseline script uses --update-snapshots=all
   - the compare script uses no --update-snapshots

4. Determinism, proven once and reported: two baseline captures of the
   same build are byte-identical on all 18 screens. (Already seen in
   OR-030; confirmed again under the new settings.)

5. Proof the check now sees what it missed, done locally and reported:
   - baseline on 17bf95f's parent state (mutedClass at #3d3d3d), then
     compare against main
   - the exact comparison fails review-queue, start, start-few,
     start-found and start-nothing
   - the old 0.2 threshold passes all of them

6. Corrected record (docs/audits/reskin-screen-log.md). For each of
   OR-028, OR-029, OR-029a and OR-030:
   - fresh baselines of the merge's parent and of the merge, both with
     --update-snapshots=all
   - a byte comparison of the two sets
   - each packet's exact changed-screen list next to what its report
     said, with the difference named
   - OR-029a in two rows: its font commit (expected zero) and its seed
     commit (expected people and people-bulk-bar)
   - OR-030's list was already exact and is recorded as-is

7. (Dropped by amendment 1.)

ACCEPTANCE CRITERIA
1. The desktop comparison is exact, enforced by a source test
2. e2e:baseline always rewrites every baseline; e2e:compare never
   rewrites any
3. Two captures of one build are byte-identical on all 18 screens
4. The exact comparison fails the screens the 0.2 threshold passed in
   OR-030 (review-queue and the four start screens), shown locally
5. reskin-screen-log.md records exact changed screens for OR-028,
   OR-029, OR-029a (font and seed separately) and OR-030, each next to
   what was originally reported
6. Browser pass 37/37 at both widths
7. No dependency added
8. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - threshold: 0 removed from the spec: the source test goes red
   - --update-snapshots=all changed to --update-snapshots in the
     baseline script: the source test goes red (a different assertion)
9. pnpm verify passes, CI green before merge

DO NOT
- Run the pixel comparison in CI
- Commit baselines (they stay local and gitignored)
- Edit the descriptions of merged PRs
- Change any component, token or seed
```

Both breaks may live in one source test file, as long as each fails a
distinct assertion and the report names which (Director).

## Amendments (Director)

```
Amendments to OR-030a:

1. Drop item 7. The repo record is enough; no comments on merged PRs.

2. Item 6 is expensive — four packets, each needing baselines of a
   merge and its parent, eight capture runs. Before doing all of it,
   run one and report the cost in wall-clock time.

   If it's cheap, do all four. If it's slow, do OR-030's parent-to-
   merge comparison only (the one we know undercounted) and record the
   other three as "not re-measured; the original count came from a
   0.2-threshold comparison and undercounts sub-threshold colour
   changes." A log entry that honestly says "unknown, and here's why"
   is worth as much as a number, and neither OR-028 nor OR-029 changed
   anything we'd act on differently.
```

Builder's note on amendment 2: OR-030's comparison was already exact
(byte-for-byte fresh captures). The counts known to undercount are OR-028
and OR-029. The one timed re-measurement is OR-028's.

## Addition to scope (Director)

```
Additional to OR-030a scope:

scripts/seed.ts truncates every table and has no host guard, while
scripts/e2e-setup.ts refuses any non-local DATABASE_URL. Give seed.ts
the same guard, reusing e2e-setup's check rather than writing a second
one — a host that is not localhost, 127.0.0.1 or ::1 refuses with exit 1
and a message naming the host it saw.

Prove it: point DATABASE_URL at a non-local host and confirm exit 1 with
nothing written.

Do NOT chain the seed into e2e:baseline or e2e:compare. Stale data
causing false positives is a documented gotcha, not a reason to give two
frequently-run scripts the power to truncate.

Instead: e2e:compare fails with a clear message if the database does not
match a fresh seed — or, if that is awkward to detect, the spec's comment
says to reseed first and names the command.
```

The re-measurements all matched; the log says "re-measured exactly, matches" (Director).
