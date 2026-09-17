# OR-002 — settings

```
TASK: OR-002
BRANCH: feat/settings

OBJECTIVE
An agent can edit their own details and their send schedule, and the
values persist and read back correctly.

WHY
Slice S1 in BUILD_PLAN.md. The digest renderer in S3 reads every one of
these fields. They must exist and be editable before it has anything to
render with.

SCOPE
- /app/settings
- Three sections: Your details, How the email looks, Sending
- Out of scope: billing (OR-018), the live digest preview (OR-011),
  headshot upload, password change, email change

DESIRED BEHAVIOR

/app/settings — three plain sections, no tabs.

  Your details
    Full name, brokerage, DRE number, phone. Email shown read-only with
    a muted line: "Contact us to change your email."

  How the email looks
    Sender name, reply-to email, accent color. Accent color is a row of
    five swatches, not a color picker: blue #2F5BFF, green #2F5D50,
    rust #B4532A, ink #0E1729, violet #6B4EBF.

  Sending
    Send day: 1st or 15th. Time of day. Timezone. A pause switch reading
    "Pause my monthly note" with a muted line beneath: "Nothing sends
    while this is on. Turn it back on any time."

  Saving: each section saves independently with its own button. On
  success the button shows "Saved" for two seconds, then returns. No
  toast, no banner.

  Validation, inline on the field:
    DRE number  — digits only, 7-8 characters
    Phone       — accept any common US format, store normalized
    Reply-to    — must be a valid email
  Never block saving a section because a different section is invalid.

IMPLEMENTATION GUIDANCE
- Server actions, consistent with OR-001.
- Every data-access function takes accountId as a required parameter.
  The session is read at the route, never inside a db helper.
- Accent color, send day, and timezone already exist on accounts.
  Add sender_name and reply_to if they do not.
- Use existing tokens and components. Do not add a UI library.

ACCEPTANCE CRITERIA
1. Each field saves and reads back after a reload
2. Each section saves independently
3. Invalid DRE, phone, and reply-to show inline errors and block only
   their own section
4. The pause switch persists
5. Accent color selection persists and is visibly indicated
6. All new data-access functions take accountId as a required parameter
7. pnpm verify passes

DO NOT
- Build billing, the digest preview, or file upload
- Add a dependency
- Let any db helper read the session
```
