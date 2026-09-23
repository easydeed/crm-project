export type Ymd = { year: number; month: number; day: number }

export function localDate(now: Date, timeZone: string): Ymd {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return { year: value('year'), month: value('month'), day: value('day') }
}

export function addDays(date: Ymd, days: number): Ymd {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day + days))
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  }
}

function addMonths(date: Ymd, offset: number): Ymd {
  const index = date.year * 12 + (date.month - 1) + offset
  return { year: Math.floor(index / 12), month: (index % 12) + 1, day: 1 }
}

function zonedParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant)
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  let hour = value('hour')
  if (hour === 24) hour = 0
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour,
    minute: value('minute'),
  }
}

export function zonedToUtc(
  date: Ymd,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  let utc = new Date(Date.UTC(date.year, date.month - 1, date.day, hour, minute, 0))
  for (let pass = 0; pass < 3; pass += 1) {
    const got = zonedParts(utc, timeZone)
    const delta =
      Date.UTC(date.year, date.month - 1, date.day, hour, minute) -
      Date.UTC(got.year, got.month - 1, got.day, got.hour, got.minute)
    if (delta === 0) break
    utc = new Date(utc.getTime() + delta)
  }
  return utc
}

export function splitTime(sendTime: string): { hour: number; minute: number } {
  const [hour, minute] = sendTime.split(':').map((part) => Number(part))
  return { hour, minute }
}

export function atLocalTime(date: Ymd, sendTime: string, timeZone: string): Date {
  const { hour, minute } = splitTime(sendTime)
  return zonedToUtc(date, hour, minute, timeZone)
}

/** The next send instant that is still ahead of `now`, in the account timezone. */
export function nextSendInstant(
  now: Date,
  sendDay: number,
  sendTime: string,
  timeZone: string,
): Date {
  const { hour, minute } = splitTime(sendTime)
  const today = localDate(now, timeZone)
  for (let offset = 0; offset < 14; offset += 1) {
    const month = addMonths(today, offset)
    const instant = zonedToUtc(
      { year: month.year, month: month.month, day: sendDay },
      hour,
      minute,
      timeZone,
    )
    if (instant.getTime() >= now.getTime()) return instant
  }
  throw new Error('Could not find the next send')
}

export function formatSendDay(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'long',
    day: 'numeric',
  }).format(instant)
}

export function nextEmailSentence(when: string, count: number): string {
  const people = count === 1 ? 'homeowner' : 'homeowners'
  return `Your next email goes out ${when} to ${count} ${people}.`
}
