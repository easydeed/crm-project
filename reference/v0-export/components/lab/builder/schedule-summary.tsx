import type { Draft } from './types'

/** Human-readable summary of a draft's schedule, shared by the When and Review steps. */
export function scheduleSummary(draft: Draft): string {
  if (draft.scheduleKind === 'onetime') {
    if (!draft.date) return 'Right away'
    const time = draft.time || '09:00'
    return `${draft.date} at ${time}`
  }
  if (draft.scheduleKind === 'recurring') {
    if (draft.recurringFreq === 'weekly') return 'Every week'
    const day = draft.recurringDay || '1'
    const suffix =
      day.endsWith('1') && day !== '11'
        ? 'st'
        : day.endsWith('2') && day !== '12'
          ? 'nd'
          : day.endsWith('3') && day !== '13'
            ? 'rd'
            : 'th'
    return `The ${day}${suffix} of every month`
  }
  return 'Whenever the record changes'
}
