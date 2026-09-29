import type { Channel } from '@/lib/lab-data'
import { type AudienceFilter, EMPTY_FILTER } from '@/lib/lab-audience'

export type AudienceMode = 'group' | 'filter' | 'farm'
export type ScheduleKind = 'onetime' | 'recurring' | 'triggered'

export type Draft = {
  name: string
  // step 1 — who
  audienceMode: AudienceMode
  groupId: string
  filter: AudienceFilter
  farmStreet: string
  // step 2 — what
  channel: Channel
  templateId: string | null
  templateName: string
  body: string
  // step 3 — when
  scheduleKind: ScheduleKind
  date: string
  time: string
  recurringFreq: 'weekly' | 'monthly'
  recurringDay: string
  trigger: string
}

export type StepProps = {
  draft: Draft
  set: (patch: Partial<Draft>) => void
  audienceCount: number
}

export const EMPTY_DRAFT: Draft = {
  name: '',
  audienceMode: 'group',
  groupId: 'My Sphere',
  filter: EMPTY_FILTER,
  farmStreet: 'Oakdale Ave',
  channel: 'email',
  templateId: null,
  templateName: '',
  body: '',
  scheduleKind: 'onetime',
  date: '',
  time: '09:00',
  recurringFreq: 'monthly',
  recurringDay: '1',
  trigger: 'deed_recorded',
}
