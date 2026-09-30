# OR-029 — Re-skin: top bar

Drafted by the builder, approved by the Director with Decisions A and B as
defaulted and the three amendments at the end.

```
TASK: OR-029
BRANCH: feat/reskin-top-bar

OBJECTIVE
The app's top bar restyled with the OR-028 tokens. Same links, same
order, same component. First application of the system to a real screen.

WHY
One component, rendered on every /app screen, with one test and no
design debt. It proves the tokens work on real markup before any
screen with more going on, and it changes every app screenshot in a
single place instead of piecemeal.

SCOPE
- src/app/app/top-bar.tsx: restyle in place
- src/app/app/layout.tsx: the Log out button gets the same treatment;
  its position does not change
- src/app/app/top-bar.test.ts: new assertions only; nothing existing
  is loosened
- src/app/design-debt.test.ts: an owner on every entry, and the admin
  entries marked permanent
- Out of scope:
  - view-as-banner.tsx (its colour comes from config, not a literal)
  - the marketing page, /login, /register, /admin
  - every screen body under the top bar

CURRENT STATE (read from the code)
- top-bar.tsx is a server component: wordmark link plus a
  <nav aria-label="App"> with three links (/app/people, /app/addons,
  /app/settings), flex-nowrap, 15px, underline on hover.
- No active-page indicator, no divider, no background of its own.
- Log out is a separate form under the bar, in layout.tsx.
- top-bar.test.ts asserts: the three hrefs, flex-nowrap, and no
  hamburger|menu-icon|aria-expanded.

DESIRED BEHAVIOR

1. The bar sits on --background with a --rule divider along its
   bottom. It is not sticky, not blurred, and has no shadow. Cards and
   bars take borders, not shadows (OR-028).

2. Wordmark: --foreground, semibold, 15px, no underline, and at least
   a 44px tap target on phones.

3. Nav links:
   - --foreground at 15px, rounded (radius md), padded to at least
     44px tall on phones
   - hover fills with --surface (foreground on surface is 16.38:1)
   - the focus ring stays a 2px outline in --foreground, offset 2px,
     the same as every other control today
   - no link drops below 15px (the export's nav is 14px; ours is not)

4. DECISION A — show the current page. APPROVED: yes.
   - The current link gets aria-current="page", --blue-soft behind it
     and --foreground text (15.30:1).
   - It does NOT use the export's blue-on-blue-soft, which is 4.42:1
     and fails the floor.
   - This makes the nav links a small client component (usePathname).
     The bar itself stays a server component.

5. DECISION B — Log out stays where it is. APPROVED: yes, restyled in
   place under the bar.

6. Tokens only. The top bar and the Log out button carry no hex
   literal and no opacity-modified colour (foreground/NN). Enforced by
   a new assertion in top-bar.test.ts. (Widened by Amendment 2.)

7. Design debt file (design-debt.test.ts):
   - Every entry gets an owner, taken from the Director's table:
     - OR-030: call-entry.tsx #3d3d3d and the four call-tags.ts colours
     - OR-031: people/ui.ts #3d3d3d and its input border
     - OR-034: settings/field.tsx input border
     - OR-035: import-form and column-mapping input borders
     - OR-036 (auth screens, new at the end of the sequence):
       login-form and register-form input borders
     - permanent: the three admin entries (accounts/search, matching
       filters, sends filters) plus sends-table #f4e4e1
   - Admin is deliberately unstyled. A comment says so, and the
     permanent entries stay in the file.
   - A structural test fails if any entry lacks an owner, or names an
     owner outside OR-030..OR-036 or "permanent".
   - OR-029 clears no debt, and says so.

ACCEPTANCE CRITERIA
1. top-bar.test.ts still passes unchanged: three hrefs, flex-nowrap,
   no hamburger. New assertions added: tokens only; aria-current.
2. The browser pass is 37/37 at both widths. On a 390px phone the
   wordmark and three links stay on one line, every one at least 44px.
3. The contrast test still passes. Any new pair the top bar uses is
   added to its PAIRS list: foreground on blue-soft is already there;
   add foreground on surface for hover if it isn't.
4. design-debt.test.ts: every entry has an owner, the four admin
   entries are marked permanent, and the owner test passes.
5. The desktop baselines are recaptured. Every /app screen changes
   (the bar is on each one); /u does not. The report says so.
6. No dependency added. No test loosened. No markup outside the top
   bar and the Log out button.
7. Two deliberate breaks, both red in CI, both reverted with an
   identical tree:
   - remove flex-nowrap: the existing top-bar test goes red
   - add a hex colour to the bar: the new tokens-only assertion goes red
8. pnpm verify passes, CI green before merge.

DO NOT
- Change the links, their order, their hrefs, or their labels
- Add a hamburger, a menu, or anything with aria-expanded
- Make the bar sticky or add a shadow
- Use blue text on --blue-soft
- Touch any screen body, /admin, or src/digest/
```

## Amendments (Director)

```
Amendments to OR-029:

1. Record OR-036 properly. Add it to the re-skin sequence in
   docs/audits/OR-027-v0-audit.md §8 as the final screen packet
   (auth screens: /login and /register), so the sequence in the audit
   matches the owners in the debt file. An owner naming a packet that
   exists nowhere else is a dangling reference.

2. The tokens-only assertion should cover the whole /app tree, not
   just the top bar. Write it as a source test that scans
   src/app/app/ for hex literals and opacity-modified colours
   (foreground/NN), with an explicit allowlist of the files that still
   carry debt — call-entry.tsx, call-tags.ts, people/ui.ts,
   settings/field.tsx, import-form, column-mapping. Each screen packet
   removes its files from the allowlist as it clears them. When the
   allowlist is empty, the debt is gone and the test enforces
   tokens-only by itself.

   That makes the debt file and the allowlist two views of the same
   fact. Report if they disagree.

3. Decision A makes the nav a client component. Confirm the top bar
   itself stays a server component and that no data crosses the
   boundary — the nav needs only the pathname.
```

## Second-round answers (Director)

```
1. One list, per colour. The tree test reads its allowlist from the
   entries in design-debt.test.ts (file + exact colour). It fails on new
   debt and on a fix that forgot to delete its entry.
2. Owners stand, including the new debt for OR-032 and OR-033. Each file
   goes to the packet that owns its screen.
3. view-as-banner.tsx stays out: INK_COLOR is a named value in config,
   and the banner is deliberately outside the app's visual system. The
   debt file says so, so nobody adds it later thinking it was missed.
Addition: the scan also catches named Tailwind palette colours
(text-white, bg-black, text-gray-500, ...). Any found today become owned
entries; if none, the rule still guards the packets ahead.
```
