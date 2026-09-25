# OR-025 — signup, find my closings

```
TASK: OR-025
BRANCH: feat/signup-closings

OBJECTIVE
An agent enters their MLS agent id at signup and sees the homes they have
sold, already ticked.

WHY
Slice S8. Every competitor's first screen is a CSV upload dialog. This one
shows the agent a list of houses they actually sold, which is recognition
rather than data entry — and it removes the biggest drop-off in the funnel
for the agents it works for.

BUILD THE FOUND-NOTHING PATH FIRST
Most newer agents represent buyers, and buyer-side sales are not attributed
to them by the agent filter. An empty result is the common case, not an
error, and it must feel like a normal fork rather than a failure.

SCOPE
- Registration step 2
- Importing a selected set of closings as contacts
- Out of scope: the /agents name search (paid add-on we do not have),
  any live MLS credential

DESIRED BEHAVIOR

1. Step 2 offers three paths, in this order

   Path 1 — Find my closings. One input: "Your MLS agent ID."
   Helper line: "It's on your MLS profile page. Not sure? Use the next
   option."

   Path 2 — Upload a list. A CSV drop zone. Also offered again after
   Path 1 finishes, so a buyer's agent can add the rest.

   Path 3 — Skip for now. Goes to the honest empty dashboard.

2. Results

   Loading: a skeleton list, not a spinner. "Searching your MLS."

   Found:
     Dana Whitfield
     We found 47 homes you've closed. Untick anyone you'd rather leave out.

   A list of address, close date, close price, each with a ticked
   checkbox. A running count at the bottom. Primary button: "Use these 47".

   Above the list, one honest muted line: "These are homes where you were
   the listing agent. If you represented buyers too, you can add those
   next."

   Found nothing:
     "We couldn't find closings under that ID. That's common if you mostly
     represent buyers."
   Then the upload option at full prominence. No red, no error icon, no
   apology. This is a fork, not a failure.

   Found 1 to 4:
     Show them, plus: "That's fewer than we'd expect. Buyer-side sales
     usually aren't listed under your ID — add those here."

   Unrecognized id:
     An inline field error and a short "where do I find my agent ID"
     panel. Distinct from found-nothing: this is the id being wrong.

3. Importing the selection

   Each selected closing becomes a contact: the property address, the
   close date, and status from the matcher exactly as CSV import does.
   Same code path — no second import implementation.

   Closings carry no email address. The MLS does not supply one. So each
   imported contact lands with no email and status needs_review for
   contact details, and the agent is told plainly:
     "47 homes added. We don't get email addresses from the MLS, so add
     those next — we can't send without one."
   Link them to the People page filtered to contacts missing an email.

   This is the honest limit of the feature and the copy must not hide it.

4. The agent id is stored on accounts.mls_agent_id, editable later in
   Settings with a "find my closings again" action.

5. Attribution — any screen showing MLS-sourced listings renders
   MlsAttribution, including this one. It is display of MLS data.

ACCEPTANCE CRITERIA
1. Found-nothing renders as a neutral fork with the upload path at full
   prominence, and uses no error styling
2. Found renders the list with every closing ticked and an accurate count
3. Unticking updates the count and excludes that closing from the import
4. The 1-to-4 case shows the extra line
5. An unrecognized id shows an inline field error, distinct from
   found-nothing
6. Importing goes through the existing import path, not a second one
7. Imported contacts have no email, are surfaced as needing one, and the
   copy says so plainly
8. The People page can filter to contacts missing an email
9. MlsAttribution renders on the results screen
10. mls_agent_id is stored and editable in Settings
11. The whole flow works against the OR-024 fixtures with no live
    credential
12. pnpm verify passes, CI green before merge

DO NOT
- Treat an empty result as an error
- Invent or guess an email address
- Build a second import path
- Use the /agents endpoint
- Add a dependency
```
