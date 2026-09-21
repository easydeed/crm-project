# OR-005a — Candidate retrieval

```
TASK: OR-005a
BRANCH: fix/candidate-retrieval

OBJECTIVE
Candidate retrieval finds the correct parcel inside a realistic-size ZIP,
and the seed exercises the review path.

WHY
OR-005 retrieve-by-ZIP-only cannot find a house in a real ZIP. Import
matching is only as good as the candidate set. The seed must also leave
needs_review rows with persisted candidates so later review UI has data.

SCOPE
- parcels.street_name_norm, computed at write time from existing matcher
  helpers (do not rewrite normalization)
- findCandidateParcels: exact (zip, street_name_norm) + fuzzy trigram
  within ZIP (or city when ZIP is missing). Never ZIP alone. Cap ~50.
- pg_trgm extension (Postgres, not an npm package)
- GIN trigram index on street_name_norm; btree on (zip, street_name_norm)
- Volume test: 10k parcels in one ZIP, including Oakdale Ave / Oakdale Ct /
  Oak Dale Dr / Oakland Ave / Oakwood Ave; target among them; messy
  variants; query under 50ms; EXPLAIN shows the new indexes
- Seed: ≥4 needs_review La Verne contacts with 2–3 contact_match_candidates
  (a) two parcels same street adjacent numbers
  (b) missing directional on a grid street
  (c) street name shared by two cities
  (d) ambiguous suffix
- Backfill existing rows (seed + any crm-dev parcels)
- Out of scope: matcher scoring, normalization rules, review picker UI,
  accountId on findCandidateParcels, crm production

CURRENT BEHAVIOR
findCandidateParcels returns up to 50 parcels in the same ZIP, or same
city + ILIKE street when ZIP is missing. No street_name_norm column.

DESIRED BEHAVIOR
1. street_name_norm exists, indexed, backfilled. Same rules as the matcher.
   Computed at write time, never query time. Do not normalize street names
   at query time.
2. findCandidateParcels always narrows by street name, using ZIP or city
   as partition, NEVER ZIP alone:
   exact: (zip, street_name_norm) equality
   fuzzy: within ZIP, trigram similarity on street_name_norm
   Return union, best first, cap ~50.
3. 10k-parcel test finds the target for every messy variant of its address.
   Retrieval over 10k under 50ms.
4. EXPLAIN shows the new indexes.
5. Seed produces ≥4 needs_review contacts with candidates.
6. La Verne import still produces the correct split for the original 47
   rows. Update expected counts if seed contact count/split changed.
7. findCandidateParcels still must NOT take accountId. Contact writes
   still take accountId.

IMPLEMENTATION GUIDANCE
- Import existing helpers; do not rewrite them. Do not change matcher
  scoring or normalization rules.
- uniqueIndex not unique() if adding uniques, so drizzle-kit push stays
  non-interactive. Push via session pooler (DATABASE_URL / 5432).
- Runtime stays DATABASE_POOLER_URL 6543 prepare:false.
- No npm dependency. pg_trgm is a Postgres extension — enable it and
  proceed.
- Keep files ≤300 lines; extract modules. If la-verne.ts / fixtures hit
  the line cap, you MAY exempt src/db/fixtures/ from check-file-length.mjs
  the way fixtures/ already is.
- Never touch crm production eajfpzavqvcvwkeicdww.

ACCEPTANCE CRITERIA
1. street_name_norm exists, indexed, backfilled
2. Retrieval never returns a ZIP-only candidate set (test this)
3. 10k-parcel test finds target for every messy variant
4. Retrieval over 10k under 50ms; report time
5. EXPLAIN shows new indexes
6. Seed produces ≥4 needs_review contacts with candidates
7. La Verne import still produces the correct split
8. pnpm verify PASS. Open PR. Wait for GitHub Actions verify SUCCESS.
   Do NOT merge OR-005a.

DO NOT
- Change matcher scoring or normalization rules
- Normalize street names at query time
- Take accountId on findCandidateParcels
- Add an npm dependency
- Touch crm production
- Merge this branch

BEFORE CODING, REPORT
1. Files you expect to create or modify
2. No npm dependency (pg_trgm is Postgres)
3. Any conflict with the existing schema

Then implement unless there is a genuine blocker.

ON COMPLETION
Push the branch, open a PR, and return the completion report format
in docs/templates/completion-report.md. Include the PR number, PR URL,
CI URL, query time, and pg_trgm note. Do not merge.
```
