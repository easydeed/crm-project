import { Eye, MapPin, KeyRound, type LucideIcon } from 'lucide-react'
import type { CallSignalKind } from '@/lib/types'
import type { Tone } from '@/components/tag'

export const SIGNAL_META: Record<
  CallSignalKind,
  { icon: LucideIcon; label: string; tone: Tone; bg: string; fg: string }
> = {
  reading_closely: {
    icon: Eye,
    label: 'Reading closely',
    tone: 'blue',
    bg: 'var(--blue-soft)',
    fg: 'var(--blue)',
  },
  new_deed_nearby: {
    icon: MapPin,
    label: 'New sale nearby',
    tone: 'coral',
    bg: 'var(--coral-soft)',
    fg: 'var(--coral)',
  },
  loan_reconveyed: {
    icon: KeyRound,
    label: 'Loan reconveyed',
    tone: 'green',
    bg: '#e7f6ef',
    fg: 'var(--green)',
  },
}
