# OR-024 — closed listings by agent

```
TASK: OR-024
BRANCH: feat/listing-provider-closed

OBJECTIVE
A provider method that returns an agent's closed listings, built and
tested against fixtures, ready for a real feed.

WHY
Slice S8. The signup flow in OR-025 depends on this shape. Built alone so
that swapping a fixture for SimplyRETS later is a one-file change.

UNVERIFIED ASSUMPTION — state this in the report
SimplyRETS documents `agent` as a filter on GET /properties. Nobody has
run `?agent={id}&status=Closed` against a live feed. The agent id is an
MLS handle, not a DRE number, and the /agents endpoint is a paid add-on
we do not have. Build to the documented shape; do not pretend it is
proven.

SCOPE
- closedByAgent on ListingProvider
- A fixture implementation and a fixture corpus
- Metering through the existing wrapper
- Out of scope: the signup UI (OR-025), the /agents endpoint, active
  listings, any live credential

DESIRED BEHAVIOR

1. The method

   closedByAgent(agentId: string): Promise<ClosedListing[]>

   ClosedListing = {
     mlsId, address, city, zip, closeDate, closePrice,
     beds, baths, sqft, propertyType,
     listingOffice, listingAgent
   }

   Newest close first. Returns an empty array for an unknown agent id —
   not an error. Empty is the expected outcome for a buyer's agent, and
   the calling code must never treat it as a failure.

2. The fixture corpus — src/providers/fixtures/closed-listings.ts, a data
   file like the matcher and digest corpora:
     - an agent with 47 closings across the six counties
     - an agent with 3 closings (the thin case)
     - an agent with 0 (the common case for a buyer's agent)
     - an unknown id
     - one closing with a missing sqft and one with a missing close price
     - two closings at the same address on different dates
     - one condo with a unit number

3. Metering — every call records a provider_calls row through the
   existing wrapper, so /admin/costs fills in when a real feed is wired.
   A fixture call records with a zero rate; it still records.

4. Rate limiting and paging are the real provider's problem, not the
   fixture's. Write the interface so a paging implementation fits without
   changing callers: the method returns the full list, and any paging is
   internal to the implementation.

5. IDX attribution — ClosedListing carries listingOffice and
   listingAgent because MLS display rules require them. Nothing may drop
   those fields on the way to a UI. A type-level test asserts they are
   non-optional.

ACCEPTANCE CRITERIA
1. Every fixture case returns the expected listings in the expected order
2. An unknown agent id returns an empty array, never throws
3. A missing sqft or close price is preserved as null, not defaulted
4. Each call records a provider_calls row
5. listingOffice and listingAgent are required fields, enforced by type
6. The report states plainly that the SimplyRETS agent filter is
   unverified and what would prove it
7. No live credential is used or required
8. pnpm verify passes, CI green before merge

DO NOT
- Call a real MLS feed
- Default a missing value to zero or an empty string
- Drop attribution fields
- Add a dependency
```
