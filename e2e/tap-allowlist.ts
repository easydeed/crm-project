/**
 * Standalone links under 44px on a phone that a named packet owns (OR-041). The owner is in the
 * entry, not in a comment or a log: an entry is debt with a name on it.
 *
 * It fails both ways, like design-debt.test.ts. A small standalone link that no entry matches is
 * red. An entry that matches nothing on a screen it names is red too, until it is deleted: when
 * the owner fixes the links, the list has to shrink with them.
 */
export type TapDebt = {
  /** Screens from e2e/screens.ts where the links appear. */
  screens: string[]
  /** The links' href, as a regular expression source. */
  href: string
  /** The packet that fixes them, e.g. 'OR-045'. */
  owner: string
  why: string
}

export const TAP_DEBT: TapDebt[] = [
  {
    screens: ['people', 'people-bulk-bar'],
    href: '^/app/people/[0-9a-f-]{36}$',
    owner: 'OR-045',
    why: 'each row’s name link, 19px. 44px names on all 51 rows add about 2,500px of scroll at 390, on a row OR-045 redesigns',
  },
  {
    screens: ['people', 'people-bulk-bar'],
    href: '^/app/people/[0-9a-f-]{36}/edit$',
    owner: 'OR-045',
    why: 'each row’s Edit link, 19px; same row, same owner',
  },
]

for (const entry of TAP_DEBT) {
  if (!/^OR-\d{3}[a-z]?$/.test(entry.owner) || !entry.why.trim() || !entry.screens.length) {
    throw new Error(`TAP_DEBT entry for ${entry.href} needs a packet owner, a reason and its screens`)
  }
}
