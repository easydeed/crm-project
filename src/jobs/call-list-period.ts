import { isTimezone } from '@/config/settings'
import { localDate } from '@/jobs/schedule-time'
import { periodOf } from '@/signals/period'

/** Noon UTC on the account's local calendar day, so the period never slips a month at midnight. */
export function callListAsOf(now: Date, timezone: string | null) {
  const zone = timezone && isTimezone(timezone) ? timezone : 'UTC'
  const day = localDate(now, zone)
  return new Date(Date.UTC(day.year, day.month - 1, day.day, 12))
}

export function callListPeriod(now: Date, timezone: string | null) {
  return periodOf(callListAsOf(now, timezone))
}
