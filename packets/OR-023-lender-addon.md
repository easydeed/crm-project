# OR-023 — add my lender

```
TASK: OR-023
BRANCH: feat/lender-addon

OBJECTIVE
A free add-on that puts the agent's lender partner beside them in the
monthly note.

WHY
Slice S7. Free to the agent, config-gated, and the simplest real exercise
of the framework's config path. It also matters commercially: a lender
partner is how agents discover products like this.

SCOPE
- The lender addon, registered, requiresConfig true
- A lender block in the digest
- Out of scope: billing the lender, a lender login, splitting costs,
  anything that charges anyone

DESIRED BEHAVIOR

1. Config

   Required: lender's full name, NMLS number, email. Optional: phone,
   company. NMLS is digits only, 6 to 8 characters. All validated by
   configSchema; the switch cannot latch until they pass.

   Once saved, the add-on row shows the lender's name and NMLS beneath
   the title.

2. The digest block

   A quiet footer block above the existing footer, after the reply
   button. Never above the content — this is a co-brand, not an ad break.

     Dana Whitfield · Coastline Realty · DRE 01998432
     Marcus Tran · Cardinal Home Loans · NMLS 448120

   Two lines, same styling weight, separated by a hairline. No photo in
   this packet — no upload path exists yet. No call to action, no rate
   quote, no "get pre-approved" copy.

   The block is part of renderDigest, gated on the add-on config being
   passed into DigestInput. The renderer stays pure: build-input reads
   the add-on state and passes the lender or null.

3. What it must not do

   No lender content above the fold. No rate, no APR, no loan product
   name, no mortgage call to action. The moment this email starts
   advertising loans it becomes a mortgage marketing piece, which changes
   what it is and what rules apply to it.

   A plain-language test asserts the rendered text contains none of:
   rate, APR, pre-approval, pre-qualify, refinance offer, apply now.

4. Disabling

   Switching off removes the block from the next send immediately.
   Already-composed send_recipients rows are not rewritten — what was
   composed is what goes out. Say so in one muted line on the add-on row:
   "Takes effect on the next note."

ACCEPTANCE CRITERIA
1. The add-on cannot enable without a valid name, NMLS, and email,
   enforced server-side
2. An invalid NMLS shows an inline error and does not latch the switch
3. The digest renders the lender block only when the add-on is enabled
   and configured
4. The block appears below the reply button and above the footer, proven
   by a rendered-output test
5. The plain-language test passes: no rate, APR, or loan call to action
   anywhere in the rendered note
6. renderDigest stays pure — the lender comes in through DigestInput,
   proven by the existing purity test
7. Disabling removes the block from the next compose, and does not
   rewrite already-composed rows
8. The bill shows $0 for this add-on
9. pnpm verify passes, CI green before merge

DO NOT
- Charge the lender or the agent
- Add a lender login or upload path
- Put any loan product, rate, or call to action in the note
- Put the block above the content
- Add a dependency
```
