# OR-004 — address matcher

```
TASK: OR-004
BRANCH: feat/address-matcher

OBJECTIVE
A pure function that takes a raw address string and returns zero to three
candidate parcels, each with a confidence score and a human-readable
reason.

WHY
Slice S2 in BUILD_PLAN.md. Every other packet in this slice is
presentation over this function's output. An unmatched person receives no
email, so match rate is the go/no-go metric for the slice.

SCOPE
- src/matching/ — the matcher and its normalization helpers
- Fixture corpus of messy California addresses
- Add Ventura to CA_TAX.counties (now six: LA, Orange, Ventura,
  San Diego, Riverside, San Bernardino)
- Out of scope: CSV import (OR-005), any UI (OR-006, OR-007), admin
  (OR-008), and any vendor or network call. This function touches
  neither the network nor the clock.

DESIRED BEHAVIOR

Signature:

  matchAddress(raw: string, candidates: Parcel[]): MatchResult

  type MatchResult = {
    status: 'matched' | 'needs_review' | 'no_parcel'
    candidates: Array<{
      parcel: Parcel
      confidence: number        // 0..1
      reason: string            // plain English, shown in the review UI
    }>                          // ordered best first, max 3
    normalized: NormalizedAddress | null
  }

The function is pure: no database, no network, no Date.now(). Candidate
parcels are passed in. A later packet supplies them from Postgres; this
one does not care where they come from.

Status rules:
  matched       one candidate at or above 0.90 and no other above 0.70
  needs_review  any other case with at least one candidate
  no_parcel     no candidate above 0.40, or the input is not a street
                address at all

Normalization, before comparison:
  - USPS-style suffix expansion both ways: St/Street, Ave/Avenue,
    Dr/Drive, Rd/Road, Ln/Lane, Ct/Court, Pl/Place, Blvd/Boulevard,
    Way, Ter/Terrace, Cir/Circle, Pkwy/Parkway
  - Directionals: N/North, S/South, E/East, W/West, plus NE/NW/SE/SW,
    both leading and trailing
  - Unit designators pulled out and held separately: Apt, Unit, #, Ste,
    Bldg, Fl. A unit number must never end up in the street field.
  - Case, punctuation, and whitespace folded
  - City misspellings against the known city list for the six counties,
    matched by edit distance
  - ZIP+4 reduced to five digits

Confidence contributions, roughly in this order of weight:
  street number exact, street name match, suffix, directional, city,
  ZIP. Name matching allows small edit distance; street number does not
  — 1142 and 1442 are different houses.

Reasons are shown to an agent, so write them in plain language:
  "Exact match on street number, name, and ZIP"
  "Same street and number, city spelled differently"
  "Street number not found on this street"
  "This looks like a PO Box, not a house"
  Never emit a reason containing a confidence number or a field name.

Non-addresses return no_parcel with a reason and never a guess:
  PO Boxes, "General Delivery", empty or whitespace, a bare city, an
  email address, a phone number, a name with no street.

FIXTURES

Create src/matching/fixtures/addresses.ts as an exported array of
  { raw: string, expect: 'matched' | 'needs_review' | 'no_parcel',
    expectApn?: string, note?: string }

Populate it with at least 60 synthetic cases across the six counties,
covering every hard case above: unit in the street field, missing
directional on a grid city, abbreviation mismatch both directions,
misspelled city, ZIP+4, trailing directional, PO Box, empty string,
transposed street number, two parcels on the same street with adjacent
numbers, a street name that is also a city name, and a Spanish street
name with and without accents.

The corpus is a data file and the tests iterate it. Adding a case must
require no test changes — real anonymized addresses will be appended to
this file later and must run without modification.

ACCEPTANCE CRITERIA
1. matchAddress is pure — no imports of db, fetch, or Date in the
   matcher module, enforced by a test
2. Every fixture case returns its expected status
3. Cases with expectApn return that parcel first
4. Every PO Box and non-address returns no_parcel, never a candidate
5. A unit number never appears in the normalized street field
6. Candidates are ordered by confidence, capped at 3
7. Reasons contain no numbers or field names
8. CA_TAX.counties lists the six counties
9. Overall match rate across the fixture corpus is reported by the test
   run as a single printed number
10. pnpm verify passes

DO NOT
- Call any vendor API, database, or network resource
- Build CSV import, UI, or admin screens
- Add a dependency without reporting it first — if you believe an
  address-parsing library is warranted, report it and wait
- Read the clock

BEFORE CODING, REPORT
1. Files you expect to create
2. Whether you intend to propose an address-parsing dependency, and why
   hand-rolled normalization is insufficient
3. Any conflict with the existing schema

Then implement unless there is a genuine blocker.

ON COMPLETION
Push the branch, open a PR, and return the completion report format
in docs/templates/completion-report.md. Include the PR number.
```
