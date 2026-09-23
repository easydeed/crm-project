function daySuffix(day: number) {
  const mod = day % 100
  if (mod >= 11 && mod <= 13) return 'th'
  if (day % 10 === 1) return 'st'
  if (day % 10 === 2) return 'nd'
  if (day % 10 === 3) return 'rd'
  return 'th'
}

export function ordinalDay(day: number) {
  return `${day}${daySuffix(day)}`
}

export function callListNote(args: {
  matchedCount: number
  entryCount: number
  openCount: number
  sendDay: number | null
  needsReview: boolean
}) {
  if (args.entryCount > 0 && args.openCount === 0) {
    if (!args.sendDay) return { note: 'All caught up. Next batch next month.' }
    return { note: `All caught up. Next batch on the ${ordinalDay(args.sendDay)}.` }
  }
  if (args.matchedCount === 0 && args.entryCount === 0) {
    if (args.needsReview) {
      return {
        note: 'No one is matched to a house yet, so there is no one to call.',
        href: '/app/people/review',
        linkLabel: 'Open the review queue',
      }
    }
    return {
      note: 'Add the people you have closed with, then we can name who to call.',
      href: '/app/people/import',
      linkLabel: 'Add your people',
    }
  }
  if (args.entryCount < 3) return { note: 'Quiet month. That happens.' }
  return null
}
