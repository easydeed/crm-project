import Link from 'next/link'
import { priceLabel } from '@/app/app/addons/row-data'
import { getAddonRegistry } from '@/addons/registry'
import { PLAN } from '@/config/costs'
import {
  barCtaClass,
  barLinkClass,
  bodyClass,
  cardTitleClass,
  displayClass,
  eyebrowClass,
  headingClass,
  planPrice,
  sectionClass,
} from '@/app/marketing/ui'

/** What the plan includes. Each one is built (docs/audits/OR-052-marketing-design-audit.md §2). */
const FEATURES = [
  { title: 'Preview before it sends', body: 'See exactly what any homeowner will get.' },
  { title: 'Skip a month', body: 'One button. Resume just as fast.' },
  { title: 'Your day, your time', body: 'Pick the send day, time and timezone.' },
  { title: 'Your name on it', body: 'Your name, brokerage and DRE on every note.' },
  { title: 'Groups', body: 'Sort people into groups right inside your list.' },
  { title: 'Export anytime', body: 'Download your list as a spreadsheet.' },
  { title: 'Unsubscribes handled', body: 'One click for them. Nothing for you to manage.' },
  { title: 'Undo a call', body: 'Marked the wrong one? Undo is right there.' },
]

export function Features() {
  return (
    <section className="bg-bar text-on-bar">
      <div className={sectionClass}>
        <div className="flex flex-col gap-4">
          <p className={`${eyebrowClass} text-gold`}>Included in the {planPrice}</p>
          <h2 className={headingClass}>The little things, handled.</h2>
        </div>
        <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex flex-col gap-2 border-t-2 border-gold pt-4">
              <p className={`${displayClass} text-[22px] font-extrabold leading-tight`}>{feature.title}</p>
              <p className={bodyClass}>{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** The add-ons as the app sells them: titles, blurbs and prices come from the registry and costs.ts. */
export function Addons() {
  const addons = getAddonRegistry().list()
  return (
    <section className="bg-background text-foreground">
      <div className={`${sectionClass} lg:grid lg:grid-cols-2 lg:items-start`}>
        <div className="flex flex-col gap-4">
          <p className={`${eyebrowClass} text-muted-ink`}>Add-ons</p>
          <h2 className={headingClass}>Extras, if you want them.</h2>
          <p className="max-w-md text-[19px] leading-snug">All start off. Turn one on when you want it, off the month you don&apos;t.</p>
        </div>
        <ul className="flex flex-col gap-3">
          {addons.map((addon) => (
            <li key={addon.key} className="flex flex-col gap-2 rounded-2xl border border-rule p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className={cardTitleClass}>{addon.title}</p>
                <p className="text-[17px] font-semibold">{priceLabel({ priceCents: addon.priceCents })}</p>
              </div>
              <p className={bodyClass}>{addon.blurb}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const NOT_THIS = ['Lead gen', 'Dialers', 'Pipelines', 'Data entry']

export function PriceAndClose() {
  return (
    <section className="bg-bar text-on-bar">
      <div className={sectionClass}>
        <div className="flex flex-col gap-5">
          <h2 className={`${eyebrowClass} text-gold`}>What it isn&apos;t</h2>
          <ul className="flex flex-wrap gap-x-7 gap-y-2">
            {NOT_THIS.map((word) => (
              <li key={word} className={`${displayClass} text-[36px] font-extrabold leading-tight line-through decoration-gold decoration-4 sm:text-[56px]`}>
                {word}
              </li>
            ))}
          </ul>
          <p className="max-w-xl text-[19px] leading-snug">Not lead gen. Not a dialer. Not a newsletter builder. Nothing to keep up with.</p>
        </div>
        <div className="grid gap-10 border-t border-rule pt-12 lg:grid-cols-2 lg:items-end">
          <div className="flex flex-col gap-2">
            <p className={`${displayClass} text-[120px] font-black leading-[0.8] tracking-[-0.035em] text-gold sm:text-[200px]`}>{planPrice}</p>
            <p className={`${displayClass} text-[22px] font-bold`}>
              a month. Up to {PLAN.contactLimit} homeowners. Cancel any month.
            </p>
          </div>
          <div className="flex flex-col items-start gap-5">
            <p className="text-[19px] leading-snug">For agents in California.</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link className={barCtaClass} href="/register">
                Start for {planPrice} a month
              </Link>
              <Link className={barLinkClass} href="/login">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
