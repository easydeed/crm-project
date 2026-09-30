import type { LucideIcon } from 'lucide-react'
import { Mail, MessageSquare } from 'lucide-react'

export type Channel = 'email' | 'sms'
export type CampaignStatus = 'live' | 'paused' | 'draft' | 'sent'

export type CampaignRun = {
  date: string
  sent: number
  opened: number
}

export type Campaign = {
  id: string
  name: string
  channel: Channel
  audienceName: string
  audienceCount: number
  schedule: string
  status: CampaignStatus
  locked?: boolean
  lastRun?: CampaignRun
  templateId?: string
}

export type Audience = {
  id: string
  name: string
  count: number
  criteria: string[]
  overlap?: boolean
}

export type Automation = {
  id: string
  trigger: string
  template: string
  target: string
  on: boolean
  runs: number
  channel: Channel
}

export type MergeField = {
  token: string
  label: string
  sample: string
}

export const MERGE_FIELDS: MergeField[] = [
  { token: 'first_name', label: 'First name', sample: 'Marilyn' },
  { token: 'street', label: 'Street', sample: 'Oakdale Ave' },
  { token: 'assessed_value', label: 'Assessed value', sample: '$817,800' },
  { token: 'annual_tax_benefit', label: 'Annual tax benefit', sample: '$2,600' },
  { token: 'last_sale_on_street', label: 'Last sale on street', sample: '$1,120,000' },
  { token: 'years_owned', label: 'Years owned', sample: '7' },
  { token: 'agent_first_name', label: 'Your first name', sample: 'Dana' },
]

const SAMPLE_CTX: Record<string, string> = Object.fromEntries(
  MERGE_FIELDS.map((f) => [f.token, f.sample]),
)

/** Replace {{token}} with sample values, leaving unknown tokens visible. */
export function renderTemplate(
  body: string,
  ctx: Record<string, string> = SAMPLE_CTX,
): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (whole, key: string) =>
    key in ctx ? ctx[key] : whole,
  )
}

export const CHANNEL_META: Record<
  Channel,
  { icon: LucideIcon; label: string }
> = {
  email: { icon: Mail, label: 'Email' },
  sms: { icon: MessageSquare, label: 'Text' },
}

export const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp-monthly',
    name: 'The monthly note',
    channel: 'email',
    audienceName: 'Everyone on your list',
    audienceCount: 47,
    schedule: 'Monthly \u00b7 1st',
    status: 'live',
    locked: true,
    lastRun: { date: '2026-08-01', sent: 47, opened: 29 },
  },
  {
    id: 'cmp-weekly',
    name: 'Weekly market note',
    channel: 'email',
    audienceName: 'Engaged readers',
    audienceCount: 12,
    schedule: 'Weekly \u00b7 Tue',
    status: 'live',
    lastRun: { date: '2026-08-25', sent: 12, opened: 10 },
    templateId: 'tpl-market-neighbors',
  },
  {
    id: 'cmp-prop19',
    name: 'Prop 19 check-in',
    channel: 'sms',
    audienceName: 'Long-time owners',
    audienceCount: 18,
    schedule: 'One-time \u00b7 Sent Aug 14',
    status: 'sent',
    lastRun: { date: '2026-08-14', sent: 18, opened: 0 },
    templateId: 'tpl-tax-prop19',
  },
  {
    id: 'cmp-farm',
    name: 'New on your street',
    channel: 'email',
    audienceName: 'Oakdale Ave farm',
    audienceCount: 140,
    schedule: 'Triggered \u00b7 a neighbor lists',
    status: 'paused',
    templateId: 'tpl-justlisted-street',
  },
  {
    id: 'cmp-anniv-draft',
    name: 'Anniversary note',
    channel: 'email',
    audienceName: 'Past buyers',
    audienceCount: 31,
    schedule: 'Draft \u00b7 not scheduled',
    status: 'draft',
    templateId: 'tpl-anniv-oneyear',
  },
]

export const SEED_AUDIENCES: Audience[] = [
  {
    id: 'aud-longtime',
    name: 'Long-time owners',
    count: 18,
    criteria: ['owned 15+ years', 'gap over $200k'],
    overlap: true,
  },
  {
    id: 'aud-engaged',
    name: 'Engaged readers',
    count: 12,
    criteria: ['opened last 3 notes'],
    overlap: true,
  },
  {
    id: 'aud-farm',
    name: 'Oakdale Ave farm',
    count: 140,
    criteria: ['on Oakdale Ave', 'whether or not they know you'],
  },
  {
    id: 'aud-quiet',
    name: 'Gone quiet',
    count: 9,
    criteria: ['no opens in 6 months'],
  },
]

export const SEED_AUTOMATIONS: Automation[] = [
  {
    id: 'auto-listed',
    trigger: 'a neighbor lists within 3 doors',
    template: 'A house just listed on your street',
    target: 'that homeowner only',
    on: true,
    runs: 14,
    channel: 'email',
  },
  {
    id: 'auto-reconvey',
    trigger: 'their loan is reconveyed',
    template: 'Looks like you paid it off \u2014 congratulations',
    target: 'that homeowner only',
    on: true,
    runs: 6,
    channel: 'email',
  },
  {
    id: 'auto-anniv',
    trigger: 'their purchase anniversary',
    template: 'One year in your home',
    target: 'that homeowner only',
    on: false,
    runs: 0,
    channel: 'email',
  },
]

export const TRIGGER_OPTIONS = [
  'a neighbor lists',
  'a neighbor sells',
  'their loan is reconveyed',
  'their purchase anniversary',
  'they open the note three times in a row',
  'they haven\u2019t opened in six months',
]
