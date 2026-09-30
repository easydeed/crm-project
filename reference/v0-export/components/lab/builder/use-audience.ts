'use client'

import { useMemo } from 'react'
import type { Draft } from './types'
import { useStore } from '@/lib/store'
import { filterContacts } from '@/lib/lab-audience'
import type { Contact } from '@/lib/types'

/** Resolve a builder draft into the live list of matching contacts. */
export function useAudience(draft: Draft): { list: Contact[]; count: number } {
  const { contacts, farmContacts } = useStore()

  const list = useMemo(() => {
    if (draft.audienceMode === 'group') {
      return contacts.filter((c) => c.groups.includes(draft.groupId))
    }
    if (draft.audienceMode === 'farm') {
      return farmContacts
    }
    return filterContacts(contacts, draft.filter)
  }, [draft.audienceMode, draft.groupId, draft.filter, contacts, farmContacts])

  return { list, count: list.length }
}

export function audienceLabel(draft: Draft, groupFallback: string): string {
  if (draft.audienceMode === 'group') return draft.groupId || groupFallback
  if (draft.audienceMode === 'farm') return `${draft.farmStreet} farm`
  return 'Filtered audience'
}
