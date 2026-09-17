# OR-003 — admin accounts

```
TASK: OR-003
BRANCH: feat/admin-accounts

OBJECTIVE
An admin can see every account and view the app as any agent, read-only.

WHY
Slice S1. Without this there is no way to see whether anything works in
production. Every later slice adds to this surface.

SCOPE
- /admin/accounts and /admin/accounts/[id]
- Read-only view-as
- admin_actions audit rows
- Out of scope: matching, sends, costs, deliverability — later slices

DESIRED BEHAVIOR

/admin/accounts
  A table: name, email, brokerage, signup date, contact count, role,
  last login. Sortable by signup date and contact count. A search box
  matching name, email, or brokerage. Rows link to the detail page.
  Empty state: "No accounts yet."

/admin/accounts/[id]
  Header: name, email, brokerage, DRE, signup date, role.
  Their settings, read-only.
  A "View as this agent" button.

View-as
  Sets a viewing-as marker on the admin's session and redirects to /app,
  which renders that agent's data.
  A fixed banner across the top, full width, ink background:
  "Viewing as Dana Whitfield — read only"  with an "Exit" button.
  Every write path is blocked while viewing-as: server actions return an
  error, and submit buttons render disabled with a muted explanation.
  An admin viewing-as cannot reach /admin until they exit.

Audit
  Entering view-as writes an admin_actions row: admin account id, target
  account id, action 'view_as', timestamp.

IMPLEMENTATION GUIDANCE
- The role gate already exists from OR-001. Reuse it; do not reimplement.
- View-as resolves an effective accountId at the route layer and passes
  it down. Do not add an ambient "current account" that db helpers read.
- The write block must be enforced server-side. Disabled buttons are a
  courtesy, not the control.

ACCEPTANCE CRITERIA
1. An admin sees all accounts; an agent gets 404 on /admin
2. Search and both sorts work
3. View-as renders the target agent's /app
4. Every write is rejected server-side while viewing-as, proven by test
5. Exiting view-as returns the admin to /admin/accounts
6. An admin_actions row is written on entering view-as
7. Contact count and last login match the database
8. pnpm verify passes

DO NOT
- Allow any write while viewing-as
- Build matching, sends, or cost screens
- Add an ambient current-account accessor
- Add a dependency
```
