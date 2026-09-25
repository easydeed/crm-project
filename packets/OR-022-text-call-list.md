# OR-022 — text me the call list

```
TASK: OR-022
BRANCH: feat/text-call-list

OBJECTIVE
A $2 add-on that texts the agent their three names on the 1st. To the
agent's own phone only.

WHY
Slice S7, and the first messaging channel after email. Texting the agent
is a different thing from texting homeowners: one low-volume message a
month to a number the agent gave us. Consumer SMS is not in MVP.

SCOPE
- A Texter interface with a fake and a Twilio implementation
- A texting send gate, mirroring assertSendAllowed
- The addon, registered
- Out of scope: texting homeowners, two-way replies, A2P registration
  flow, any message to a number the agent did not enter as their own

DESIRED BEHAVIOR

1. Texter — src/text/texter.ts, mirroring the Mailer pattern exactly

   interface Texter {
     send(msg: {
       to: string              // E.164
       body: string
       idempotencyKey: string
     }): Promise<{ providerId: string }>
   }

   FakeTexter records and sends nothing; tests always use it.
   TwilioTexter is the real one. setTexter / getTexter, same shape as
   setMailer.

2. THE GATE — src/text/text-guard.ts

   assertTextAllowed(ctx) throws unless ALL of:
     - env TEXTING_ENABLED === 'true'  (default false everywhere)
     - the destination equals the account's own verified phone
     - the account has an active subscription
     - the add-on is enabled for that account

   The own-phone check is the important one. This add-on must be
   structurally incapable of texting anyone but the agent. A source test
   proves only one function calls texter.send, and that function calls
   the guard first — the same construction as mailer.send.

3. Phone verification

   The agent's phone in Settings becomes verified before this add-on can
   turn on: send a six-digit code, they enter it, store verified_at.
   Changing the phone clears verification and disables the add-on with a
   plain message.

   This is config-gated in registry terms: requiresConfig true, and the
   config is the verified phone.

4. The message

   Sent by the build_call_lists job, after the list is written.
   Plain text, under 320 characters, no link shortener:

     onrecord — 3 to call this month.
     Marilyn Okafor: big sale next door.
     Ray & Teresa Villanueva: paid off their loan.
     Glenn Sato: been a while.
     <app url>/app

   Fewer than three names sends fewer lines. No names sends nothing at
   all — never text "you have nothing to do."

   Idempotency key is `${accountId}:${period}`, so a job re-run cannot
   double-text.

5. Failure

   A failed text never fails the call-list job. Record the error, move
   on. The list on the dashboard is the source of truth; the text is a
   convenience.

   Twilio hard failures (unreachable number, opt-out) disable the add-on
   and tell the agent on the dashboard in plain language.

6. STOP

   If the agent replies STOP, Twilio suppresses the number at the carrier
   level. Handle the status webhook, disable the add-on, and show:
   "You replied STOP, so we stopped texting you. Turn it back on here
   and confirm your number again."

ACCEPTANCE CRITERIA
1. assertTextAllowed throws under default env, proven by test
2. It throws for any destination that is not the account's verified
   phone, proven by test
3. Only one function calls texter.send, and it calls the guard first,
   proven by a source test
4. The add-on cannot enable without a verified phone
5. Changing the phone clears verification and disables the add-on
6. The job sends one text per account per period; a re-run sends nothing
   further, proven by FakeTexter call count
7. An account with no call list entries receives no text
8. A failed text does not fail the job; the error is recorded
9. A STOP reply disables the add-on and shows the plain message
10. With default env, a full job run writes the call list and sends no
    text
11. The bill shows $2 when enabled
12. pnpm verify passes, CI green before merge

DO NOT
- Text any number other than the agent's own verified phone
- Set TEXTING_ENABLED true in committed code or CI
- Use a real Twilio credential in tests
- Build consumer texting or two-way replies
- Add a dependency other than the Twilio client, which you may add
```
