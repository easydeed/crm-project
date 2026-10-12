# OR-044a — The states no capture shows

Drafted by the builder for the Director. Approved with A–D as defaulted and E settled.

```
TASK: OR-044a
BRANCH: test/unseen-states

OBJECTIVE
Every state worth seeing gets a capture. Each one runs the 390 checks,
so a tap, contrast or overflow fault in a state nobody has looked at
turns red instead of shipping. The OR-043 second agent becomes the
general mechanism: a table of named e2e agents, each built for one state.
Setup fails if an agent stops producing its state.

WHY
Every finding in this packet has the same root: a state exists in code,
passes its tests, and has never been looked at. Four real defects so far,
none caught by 562 passing tests, all found by asking what the captures
don't show:
- the email preview that was blank (OR-043a)
- the call tags (OR-043)
- the scheduled send card (finding 1)
- the billing 404 (finding 3)
This packet asks that question of every screen at once.

APPROVED DECISIONS (Director, OR-044a review): A, B, C and D take their
defaults. E is settled as written. The quiet agent must keep showing
"Set when the note goes out."

WHAT THE AUDIT FOUND (inventory of src/app, admin excluded; 27 captures today)
1. The dashboard's scheduled send card has never been captured.
   - Both e2e agents have a null send_time. The seed never sets it, and
     the column has no default.
   - So every dashboard capture shows "Set when the note goes out."
   - OR-044's Decision A (Preview it primary, Skip as a form button) has
     never been seen in a capture.
2. Billing's invoice Pay/View links can't render in e2e. Both fake
   invoices have url: null (src/billing/e2e-gateway.ts:17-18).
3. /app/settings/billing throws for the quiet agent: the e2e gateway has
   no sub_e2e_quiet. No capture visits it, so nobody saw. The same throw
   is a product bug (Decision E):
   - Any subscriptions row whose stripe_sub_id Stripe answers 404 for
     gets billing/error.tsx: "We couldn't reach Stripe… Try again in a
     minute."
   - Both sentences are false. Stripe was reached and answered, and
     trying again never helps.
   - In production, that row is every test-mode row the moment the live
     key goes in. GO_LIVE.md doesn't say to clear them.
4. The add-ons "Texting your clients" band is reserved, and already
   absent.
   - It is the $9 carrier band for consumer SMS (PROJECT_STATE:39-40),
     specced in OR-021 before any add-on used it.
   - addons-panel.tsx:18 renders only bands that hold an add-on, so in
     production it isn't rendered at all, not rendered empty.
   - The gap: no test holds that. addons-ui.test:43 only proves the band
     appears when the fixtures fill it.
5. The phone code-sent state can't be reached in e2e. src/text/current.ts
   always uses Twilio, and e2e has no texter stand-in. I didn't click it:
   it would try a real send.
6. The view-as banner is reachable for real. e2e has no admin account,
   but /admin's View as works when an admin signs in.

SCOPE
0. Commit 1, before any capture (so the comparison keeps the causes
   apart): the billing fix per Decision E.
   - The gateways (Stripe's, the fake, e2e) raise a typed
     SubscriptionNotFound when Stripe answers 404 resource_missing. Every
     other failure still throws as now.
   - loadBillingView returns { kind: 'missing' } on it. The page renders
     that as an in-page panel.
   - billing/error.tsx stays for real failures to reach Stripe.
   - The dashboard and the send gate read the DB row, so they are
     unchanged.
   - GO_LIVE.md gains a line: clear the test-mode subscription rows
     before the live key goes in.
   - Unit tests: 404 gives missing; any other error still throws.

1. The agents table: src/db/fixtures/e2e-agents.ts.
   - Each entry has:
     - a fixed id and email
     - account fields (send_time, paused, phone, phone_verified_at)
     - its billing (the subscriptions row and the matching e2e-gateway
       subscription and invoices)
     - its people (copies of Dana's, as the quiet agent's are)
     - any groups, add-ons or admin actions
     - expects: the state it exists to show
   - scripts/e2e-setup.ts builds every entry. Before writing .state.json
     it checks each agent's expects against the real loaders:
     - loadHomeSend kind
     - the billing state
     - phone state
     - pause state
     - people count
     It throws on any mismatch, as OR-043a does for the preview.
   - e2e-gateway.ts builds its subscriptions and invoices from the same
     table. Every agent with a sub_ id has a gateway entry, the quiet
     agent included. The missing and unreachable agents are the
     deliberate exceptions.
   - auth.setup logs every agent in through the real form. Screen.as
     takes any agent key.

2. The agents (12 new; Dana and the quiet agent stay):

   | Agent | Built for |
   |---|---|
   | Dana | the scheduled send card (Decision A) |
   | empty | no people; the dashboard's import card; settings' sample preview; no phone |
   | groups | three groups with members; one unsubscribed person; one with no email |
   | paused | the agent pause: dashboard Unpause, settings' checked box |
   | system-paused | a complaint_pause admin action: both pause lines |
   | past-due | gateway past_due; an open invoice with a url (Pay this invoice) |
   | set-to-end | cancelAtPeriodEnd; a paid invoice with a url (View invoice) |
   | ended | gateway canceled: "Restart your plan" |
   | no-plan | no subscription: billing's no-plan state and the dashboard card |
   | missing | a sub_ id Stripe has no record of: the new in-page state (Decision E) |
   | unreachable | a sub_ id whose lookup fails like a network error: billing/error.tsx, deliberately |
   | extras-on | verified phone; lender on with config; call list on |
   | admin | role admin; signs in, then View as Dana (Decision B) |

   Plus one account with no usable password, used only by the "email
   taken" capture (Decision D).

   - Invoice urls are https://billing.example/… (a reserved domain), and
     never a stripe.com address.
   - No credential is shown on any page.

3. New captures (about 44; the list is final at build, and each prepare
   asserts its state's own words):

   | Area | Captures |
   |---|---|
   | Dashboard | dashboard (now scheduled, Decision A); paused; system-paused; past-due; no-plan; empty (import card); view-as |
   | People | empty; no search results (typed); status filter (?status=no_parcel); groups (populated panel, group and email chips, Unsubscribed tag); groups-bulk (two selected: plural line, Add/Remove enabled); view-as (the read-only lines) |
   | Person | needs-review (Samir); couldn't-find (Helen); the HTML preview (the default mode); edit (viewed, not saved); groups' person (groups listed, add-to-group select) |
   | Review | the couldn't-find panel (?contact=Helen) |
   | Billing | set-to-end; past-due with Pay; ended; no-plan; missing (Decision E); unreachable (error page); each of the six notices by URL |
   | Add-ons | call list refused (switch clicked while unverified: nothing is written); extras-on (lender summary, call list on, both in the bill bar) |
   | Settings | empty (no phone, sample preview); extras-on (verified); paused; system-paused |
   | Login | mismatch (an unknown address, so no real login is typed); signing in (Decision C); dark |
   | Register | password too short; email taken (Decision D); creating account (Decision C); dark |
   | Loading | /app and /app/people loading boundaries (Decision C) |

   Dark mode is added only for login and register, as listed. Every other
   new state is light. dashboard-dark and addons-dark already cover the
   tokens.

4. e2e/screens.ts splits by area into e2e/screens/*.ts. It is 197 lines
   today, and about 44 entries would take it past 300. The SCREENS export
   and its order for the existing 27 stay, so the comparison still pairs
   like with like.

5. A check that finds a fault in a newly seen state:
   - If the fix is a class on an existing element, it lands in this
     packet as its own commit.
   - Anything bigger stops the packet and comes back as a finding.
   - No TAP_DEBT entry, no skipped check.

6. The texting band (finding 4): a unit test that a band with no add-on
   in it renders nothing, neither heading nor note. No code change.
   05-open gets no entry: the band is reserved and absent, which is
   correct.

7. Docs:
   - README's e2e section: the agents table, and how to add one.
   - billing.md: the missing state.
   - GO_LIVE.md: the line from item 0.
   - The reskin-screen-log row.
   - 05-open:
     - the code-sent state (finding 5)
     - the states still uncaptured, with why

NOT CAPTURED, WITH WHY
- Root error.tsx and the other error boundaries except billing's. Each
  needs a server error that only test code in src could throw.
- The phone code-sent state and its confirm errors (finding 5). They
  need an e2e texter stand-in like the billing one. I propose a separate
  packet for that.
- The texting band (finding 4). It is reserved, and it is absent until
  its add-on exists. Its absence is held by item 6's test, and a capture
  would only show the page without it.
- States that a prepare can only reach by writing to the shared database:
  - called, dismissed and Undo
  - Skip / Resume
  - saved settings
  - import results
  - /u after a POST
  Each would change other captures. They need their own agents, and I
  propose they come later if wanted.
- The text-stopped dashboard notice. It isn't on the list, so I've left
  it out. It needs an agent with a stopped text_messages history.

DECISIONS

A. The scheduled send card. Default: on Dana, by setting her send_time
   in e2e-setup.
   - The design draws the dashboard in this state, and it is what an
     agent sees every month. Dana is the agent every capture shows.
   - Three captures change: dashboard, dashboard-dark and
     dashboard-call-open. They are named in this packet's comparison as
     the only changes to existing captures.
   - The quiet agent keeps a null send_time, so "Set when the note goes
     out." stays captured (dashboard-quiet).
   - The sentence holds the next send date, which moves every day. It is
     the same on any one day, and comparisons are same-day already.
   - Say "own agent" to leave Dana as she is and add a scheduled agent.
     No existing capture changes, but the main dashboard captures keep
     showing the less common state.

B. View-as. Default: a real admin account signs in and clicks View as.
   - It is the path an admin actually takes.
   - The session cookie is signed with SESSION_SECRET, so a test could
     mint an admin session directly. That skips the real path ("probe
     with the real thing").
   - Say "mint" to mint the cookie in auth.setup instead.

C. Pending and loading states. Default: captured by holding the request.
   - The prepare intercepts the server-action POST, or the RSC fetch for
     loading, with page.route.
   - It holds the request until the screenshot is taken, then releases
     it. The state is held, not raced.
   - That covers:
     - "Signing in…"
     - "Creating account…"
     - the /app loading boundary
     - the /app/people loading boundary
   - Say "skip" to leave transient states uncaptured.

D. "That email already has an account." needs a registered email in the
   field.
   - Default: an account that exists only for this, with no usable
     password. Its email is not a login.
   - Say "quiet" to use the quiet agent's email instead. That is a
     working e2e login shown in a capture.

E. Billing when Stripe has no record of the plan. SETTLED in review:
   in-page, with no action, in commit 1.
   - Heading: "We can't find your plan."
   - Line: "Write to help@onrecord.com and we'll sort it out." (the
     SUPPORT_EMAIL constant from OR-026, never typed)
   - No "Start your plan". The DB row still says active, so sending
     continues, and a second checkout could charge twice for a plan the
     account already shows as live. A support address is the right way
     out of a state that shouldn't exist.
   - GO_LIVE.md: clear the test-mode subscription rows before the live
     key goes in. Without that, every account lands here at go-live.

PROPERTY TESTS (each proven both ways)
- Every agent in e2e-agents.ts is used by at least one capture, and every
  Screen.as names a listed agent. A unit test, failing both ways.
- e2e-setup throws when an agent's expects doesn't match what the
  loaders return. Proven by the first CI break.
- Every new prepare asserts its state's own words or role, as the start-*
  captures do. A capture that lands on the wrong state fails rather than
  photographing it.
- e2e-gateway has a subscription for every agent with a sub_ id, except
  the two marked missing and unreachable. A unit test.
- Billing (Decision E): a 404 from Stripe gives the missing view, never
  error.tsx; a 500 still throws. In the account-billing unit test, with
  the fake gateway.
- The texting band: a band with no add-on renders no heading and no note
  (item 6).
- No capture fills a field with an e2e agent's email or password, apart
  from auth.setup's sign-ins. A source test over e2e/screens/.

ACCEPTANCE CRITERIA
1. Every existing test passes. No check is loosened, skipped or put on an
   allowlist.
2. The new property tests pass, each proven both ways.
3. Step 0: three fresh-seed captures of the branch, the third after two
   match, every capture byte-identical across runs.
4. The exact comparison against main, same day:
   - The existing 27 are byte-identical, except dashboard,
     dashboard-dark and dashboard-call-open under Decision A.
   - The new captures have no baseline and are listed with their names.
5. Browser pass green at both widths. Any fault found in a new state is
   fixed per scope item 5 and named in the report.
6. No dependency, no schema change, no new colour.
   - The only new copy is Decision E's two lines.
   - No change in src/ outside:
     - commit 1 (the billing fix)
     - the e2e gateway
     - any fix item 5 calls for
7. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - The paused agent's paused flag dropped: e2e setup is red on its
     expects check, and nothing else.
   - An agent added to the table with no capture: the agent-use unit
     test is red.
8. pnpm verify passes, CI green before merge.

DO NOT
- Put any of this in scripts/seed.ts. Agents, dates and fake invoices
  live in e2e setup only.
- Show a password, a demo login or a working credential in any capture.
- Use a stripe.com or twilio.com address, or make a real network call.
- Reach a state through a prepare that writes to data another capture
  reads.
- Add a TAP_DEBT entry or skip a check to get a new state green.
```

## Found while auditing, not absorbed

- **The scheduled card was never seen.** Every dashboard capture since
  OR-017c has shown the settings card, because the seed never set a send
  time. OR-044 restyled the scheduled state's two actions, and no capture
  could show the result. Same root as OR-043a's blank preview: the
  fixture decides what the captures can see, and nobody checked what it
  decides.
- **The quiet agent's billing throw is a fixture gap that exposed a
  product bug.** The fixture half is fixed by the agents table. The
  product half is Decision E. The go-live line matters most: lifting the
  sk_test_ guard would send every existing account to "We couldn't reach
  Stripe".
- **I overstated the texting band in the OR-047 report.** "Can't render
  in production" was true, but it read as "rendered empty". It is
  absent, by addons-panel.tsx:18's filter, and reserved for the $9
  consumer-SMS band. The real gap is that no test holds its absence.
  Item 6 adds that test.
- **For OR-048**, from your OR-047 review: a check that transforms its
  input before asserting must fail when the transformation no longer
  applies. buttonClass (OR-042), the text-[…] exemption (OR-046) and the
  size strip (OR-047) are its three instances.
- **Phone verification can't be tested end to end.** The code-sent state,
  its three confirm errors and "Send a new code" have no capture and no
  browser test. A texter stand-in for e2e, as billing has, would open all
  of them.
