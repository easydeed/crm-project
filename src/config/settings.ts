export const INK_COLOR = '#0E1729'

export const ACCENT_COLORS = [
  { name: 'blue', value: '#2F5BFF' },
  { name: 'green', value: '#2F5D50' },
  { name: 'rust', value: '#B4532A' },
  { name: 'ink', value: INK_COLOR },
  { name: 'violet', value: '#6B4EBF' },
] as const

export const SEND_DAYS = [
  { label: '1st', value: 1 },
  { label: '15th', value: 15 },
] as const

export const SEND_TIMES = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
] as const

export const TIMEZONES = [
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
] as const

export type AccentColor = (typeof ACCENT_COLORS)[number]['value']
export type SendDay = (typeof SEND_DAYS)[number]['value']
export type SendTime = (typeof SEND_TIMES)[number]
export type Timezone = (typeof TIMEZONES)[number]

export function isAccentColor(value: string): value is AccentColor {
  return ACCENT_COLORS.some((color) => color.value === value)
}

export function isSendDay(value: number): value is SendDay {
  return SEND_DAYS.some((day) => day.value === value)
}

export function isSendTime(value: string): value is SendTime {
  return (SEND_TIMES as readonly string[]).includes(value)
}

export function isTimezone(value: string): value is Timezone {
  return (TIMEZONES as readonly string[]).includes(value)
}
