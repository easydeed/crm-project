import type { Contact } from './types'

export type HistoryKind =
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'sms_sent'
  | 'call_logged'

export type HistoryEvent = {
  id: string
  kind: HistoryKind
  label: string
  when: string
}

const MONTHS = [
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
]

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * A believable, deterministic activity trail for one client. Engagement level
 * shapes how much opening/clicking shows up, so the timeline matches the tag.
 */
export function seededHistory(contact: Contact): HistoryEvent[] {
  const seed = hash(contact.id)
  const opensLots = contact.engagement === 'opened_recently'
  const opensSome = contact.engagement === 'quiet'
  const events: HistoryEvent[] = []

  MONTHS.forEach((month, i) => {
    const r = (hash(contact.id + month) % 100) / 100
    events.push({
      id: `${contact.id}-${month}-sent`,
      kind: 'email_sent',
      label: `Monthly note sent \u2014 \u201cWhat sold near ${contact.address.split(' ').slice(1).join(' ')}\u201d`,
      when: `${month} 1`,
    })
    const willOpen = opensLots || (opensSome && r > 0.4) || (!opensSome && r > 0.85)
    if (willOpen) {
      events.push({
        id: `${contact.id}-${month}-open`,
        kind: 'email_opened',
        label: 'Opened it',
        when: `${month} ${2 + Math.floor(r * 4)}`,
      })
      if (opensLots && r > 0.5) {
        events.push({
          id: `${contact.id}-${month}-click`,
          kind: 'email_clicked',
          label: 'Clicked through to their record',
          when: `${month} ${2 + Math.floor(r * 4)}`,
        })
      }
    }
  })

  // A call, if they're a strong signal.
  if (opensLots && seed % 2 === 0) {
    events.push({
      id: `${contact.id}-call`,
      kind: 'call_logged',
      label: 'You logged a call \u2014 \u201cchecked in, all good\u201d',
      when: 'July 12',
    })
  }

  // Newest first.
  return events.reverse()
}
