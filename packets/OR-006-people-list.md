# OR-006 — People list

```
TASK: OR-006
BRANCH: feat/people-list

OBJECTIVE
Full People page: list, search, filter, groups, bulk, export, thin
detail, edit, delete. Reuse the thin list from OR-005 — replace it,
do not duplicate a second list.

WHY
Slice S2. The list is how an agent finds someone and keeps the book
honest. Search that only covers the first page, a second matcher on
edit, write-only phone, and inert bulk were how TrendyReports lost
trust. Groups live here so we never grow a second address book.

SCOPE
- Replace src/app/app/people/people-list.tsx and page.tsx
- /app/people/[id] thin detail, /app/people/[id]/edit, review stub
- Groups CRUD on this page only; no default group
- Re-match on address edit via findCandidateParcels + matchAddress +
  the same persist path as import
- Out of scope: review picker (OR-007), digest, engagement, server
  search, pagination, new nav item, npm dependency, schema change,
  dropping parcels_zip_idx

DESIRED BEHAVIOR

1. List columns: name, address, status only. Status copy exact:
   matched → On the map
   needs_review → Needs a look
   no_parcel → Couldn't find
   No engagement, last-opened, or send data.

2. Top: "N people" and Add people → /app/people/import.

3. Search name, email, address across the entire list. Load the full
   list client-side (product cap 250). Never silently truncate. Search
   must find a contact in the last of 250.

4. Filter Status: All · On the map · Needs a look · Couldn't find
   with counts. Group: All people + each group with count. Filters
   combine. URL reflects them so ?status=needs_review works.

5. Groups on this page only. Create, rename, delete. Deleting a group
   never deletes people. Do not seed a default group. Empty groups:
   muted "Groups are optional. Make one if you want to sort people."
   plus New group link.

6. Bulk: checkboxes + select-all. Bar only when selection exists:
   Add to group · Remove from group · Export · Delete. No inert
   selection.

7. Export CSV of the filtered view or the selection. Every column the
   detail view shows. Filename includes the date.

8. Edit from row or detail: name, email, phone, address, close date,
   notes. All pre-fill. Address change re-runs the matcher, updates
   status, confirmation: "Saved. We re-checked the address."

9. Delete: hard delete, confirmation names the person. Cascades
   group_members and contact_match_candidates.

10. /app/people/[id]: name, email, phone, address, close date, notes,
    match status, groups. Matched: parcel address + APN.
    needs_review: Review this match — real href
    (/app/people/[id]/review stub that names the next step).
    no_parcel: Fix the address opens edit. Edit and Delete.
    Add-to-group from detail too.

11. Phone in list data (even if not a column), detail, edit pre-fill,
    and export. Never write-only.

12. Every contact and group function takes accountId as required.
    assertWritable on every mutation. Session at route/action only.

13. Four states per screen. No file over 300 lines — split list,
    filters, bulk bar, group manager, edit form. Prefer-reduced-motion,
    15px min, focus rings, 4.5:1 contrast.

14. Mobile 390px: name over address, status right-aligned. Bulk bar
    stays visible when active.

Every contact write takes accountId. Read session at the route or
action; effective accountId at the route. No ambient current account
in db helpers. View-as cannot mutate.

Re-matching MUST call findCandidateParcels + matchAddress and persist
candidates the same way import does. No second matching path.

ACCEPTANCE CRITERIA
1. List shows name, address, status only with the exact status copy
2. Page has no engagement, last-opened, or send data
3. Top shows "N people" and Add people → /app/people/import
4. Client search by name, email, address covers the full list; 250
   rows are not truncated; search finds the last of 250
5. Status filter All · On the map · Needs a look · Couldn't find
   with counts; ?status=needs_review works
6. Group filter All people + each group with count; filters combine
7. Groups: create, rename, delete; delete group never deletes people;
   no default group; empty-groups copy + New group
8. Bulk checkboxes + select-all; bar only when selection exists;
   Add to group · Remove from group · Export · Delete
9. Add to group from the bulk bar and from the person detail
10. Export CSV of filtered view or selection; every detail column;
    filename includes the date
11. Edit pre-fills name, email, phone, address, close date, notes;
    address change rematches via the import path; confirmation
    "Saved. We re-checked the address."
12. Hard delete; confirmation names the person; cascades
    group_members and contact_match_candidates
13. Detail shows the listed fields; matched parcel address + APN;
    needs_review Review this match (real href); no_parcel Fix the
    address opens edit; Edit and Delete
14. Phone appears in list data, detail, edit, and export
15. Every contact/group function takes accountId; assertWritable on
    mutations; session at route/action only
16. Four states per screen; files ≤300 lines; mobile 390px name over
    address, status right, bulk bar visible; a11y
17. pnpm verify PASS. Push and open PR. Watch CI SUCCESS.
    Do NOT merge feat/people-list.

DO NOT
- Build the review screen (OR-007)
- Digest, engagement, server search, pagination
- Add a Groups nav item
- Seed a default group
- Add an npm dependency
- Change the schema or drop parcels_zip_idx
- Merge feat/people-list
- Touch crm production

BEFORE CODING, REPORT
1. Files you expect to create and replace
2. Reuse of findCandidateParcels + matchAddress + import persist
3. Any conflict with the current schema

Then implement unless there is a genuine blocker.

ON COMPLETION
Push the branch, open a PR, and return the completion report format
in docs/templates/completion-report.md. Include the PR number and CI
URL. Note how each of 8–16 is proven. Report only checks you ran.
Do not merge until GitHub Actions verify is SUCCESS.
```
