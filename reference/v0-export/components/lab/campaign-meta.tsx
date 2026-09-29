import type { CampaignStatus } from '@/lib/lab-data'
import type { Tone } from '@/components/tag'

export const CAMPAIGN_STATUS_META: Record<
  CampaignStatus,
  { label: string; tone: Tone; dot: boolean }
> = {
  live: { label: 'Live', tone: 'green', dot: true },
  paused: { label: 'Paused', tone: 'grey', dot: true },
  draft: { label: 'Draft', tone: 'blue', dot: false },
  sent: { label: 'Sent', tone: 'grey', dot: false },
}
