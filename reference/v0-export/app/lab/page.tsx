import Link from 'next/link'
import {
  Megaphone,
  PencilRuler,
  MessageSquare,
  LayoutTemplate,
  Layers,
  UserSquare,
  Users,
  Zap,
  ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { LabHeader } from '@/components/lab/lab-nav'

type Screen = {
  href: string
  icon: LucideIcon
  name: string
  blurb: string
  cost: string
  weight: 'light' | 'medium' | 'heavy'
}

const SCREENS: Screen[] = [
  {
    href: '/lab/campaigns',
    icon: Megaphone,
    name: 'Campaigns',
    blurb: 'Everything that sends, in one list. The monthly note pinned and locked at the top.',
    cost: '3\u20134 weeks. The audience filter builder alone is ~1 week and needs indexed queries across parcels and events.',
    weight: 'heavy',
  },
  {
    href: '/lab/campaigns/new',
    icon: PencilRuler,
    name: 'Campaign builder',
    blurb: 'Four steps: who, what, when, review. Live audience counts and merge-field previews.',
    cost: 'Part of the 3\u20134 week campaigns build. Every step hides real backend work.',
    weight: 'heavy',
  },
  {
    href: '/lab/composer',
    icon: MessageSquare,
    name: 'Text campaigns',
    blurb: 'A composer with a live phone preview, segment counter, and a compliance panel.',
    cost: '2 weeks for the UI, plus 3\u20135 days of carrier registration per account, plus ongoing A2P monitoring. The screen is the easy part.',
    weight: 'medium',
  },
  {
    href: '/lab/templates',
    icon: LayoutTemplate,
    name: 'Template gallery',
    blurb: 'A grid of ready-made notes across seven categories, half of them premium.',
    cost: '1 week for the gallery, then ongoing forever. This is a staffing decision disguised as a feature.',
    weight: 'medium',
  },
  {
    href: '/lab/plans',
    icon: Layers,
    name: 'Plans',
    blurb: 'What\u2019s included, what\u2019s extra, and why the premium band honestly costs more.',
    cost: 'A few days. The honesty is the hard part, not the code.',
    weight: 'light',
  },
  {
    href: '/lab/people/c-okafor',
    icon: UserSquare,
    name: 'The full client page',
    blurb: 'The maximal record view: parcel map, timeline, tax profile, read history, household, loan.',
    cost: '2\u20133 weeks. The assessed-vs-market chart and read-history grid are the expensive parts \u2014 and the most tempting.',
    weight: 'heavy',
  },
  {
    href: '/lab/audiences',
    icon: Users,
    name: 'Saved segments',
    blurb: 'Reusable audiences with readable filter chips and an overlap warning.',
    cost: '1 week, and the screen most likely to go unused.',
    weight: 'light',
  },
  {
    href: '/lab/automations',
    icon: Zap,
    name: 'Triggered sends',
    blurb: 'When-this-then-that rules in plain language, each with an on/off switch.',
    cost: '2 weeks, plus a daily event-detection pipeline. This turns a monthly batch into a daily job \u2014 the largest hidden cost here.',
    weight: 'heavy',
  },
]

const WEIGHT_LABEL: Record<Screen['weight'], string> = {
  light: 'Cheap',
  medium: 'Moderate',
  heavy: 'Expensive',
}

const WEIGHT_TONE: Record<Screen['weight'], string> = {
  light: 'bg-[#e7f6ef] text-green',
  medium: 'bg-blue-soft text-blue',
  heavy: 'bg-coral-soft text-coral',
}

export default function LabOverviewPage() {
  return (
    <>
      <LabHeader
        title="A divergent exploration"
        subtitle={
          'Eight screens built to be evaluated, not shipped. The current app is untouched \u2014 this is a parallel set to argue over.'
        }
      />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="mb-8 max-w-2xl rounded-2xl border border-line bg-white p-5">
          <p className="text-[15px] leading-relaxed text-ink">
            The product ships one thing well: a monthly note built from the
            county record. Everything below is a bet on what could sit beside
            it {'\u2014'} campaigns, texting, templates, automations, and a
            far richer client page.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            Each screen carries an honest build cost. The point isn&apos;t to
            build all of it. It&apos;s to see it, then decide what earns its
            place. Every control here works against local state.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCREENS.map((s) => {
            const Icon = s.icon
            return (
              <Link
                key={s.href}
                href={s.href}
                className="group flex flex-col rounded-2xl border border-line bg-white p-5 transition-colors hover:border-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between">
                  <div className="grid size-10 place-items-center rounded-xl bg-blue-soft text-blue">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11.5px] font-[600] ${WEIGHT_TONE[s.weight]}`}
                  >
                    {WEIGHT_LABEL[s.weight]}
                  </span>
                </div>
                <h2 className="mt-4 flex items-center gap-1.5 text-[16px] font-[640] text-ink">
                  {s.name}
                  <ArrowRight
                    className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none"
                    aria-hidden
                  />
                </h2>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                  {s.blurb}
                </p>
                <p className="mt-4 border-t border-line pt-3 text-[12.5px] leading-relaxed text-muted-foreground">
                  <span className="font-[620] text-ink">If shipped: </span>
                  {s.cost}
                </p>
              </Link>
            )
          })}
        </div>
      </main>
    </>
  )
}
