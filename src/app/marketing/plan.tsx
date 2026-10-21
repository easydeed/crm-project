import Link from 'next/link'
import { AddonSwitches } from '@/app/marketing/addon-switches'
import { SurveyEtch } from '@/app/marketing/etch'
import { displayClass, eyebrowClass, goldCtaClass, headingClass, planPrice, sectionClass } from '@/app/marketing/ui'
import { getAddonRegistry } from '@/addons/registry'
import { formatDollars, PLAN } from '@/config/costs'

const FEATURES = [
  { title: 'Preview before it sends', body: 'See exactly what any homeowner will get.' },
  { title: 'Skip a month', body: 'One button. Resume just as fast.' },
  { title: 'Your day, your time', body: 'Pick the send day, time and timezone.' },
  { title: 'Your name on it', body: 'Name, brokerage and DRE on every note.' },
  { title: 'Groups', body: 'Sort people into groups right inside your list.' },
  { title: 'Export anytime', body: 'Download your whole list as a spreadsheet.' },
  { title: 'Unsubscribes handled', body: 'One click for them. Nothing for you to manage.' },
  { title: 'Undo a call', body: 'Marked the wrong one? Undo is right there.' },
]

export function Features() {
  return (
    <section id="features" className="bg-mkt-navy text-mkt-white">
      <div className={sectionClass}>
        <div className="flex flex-col gap-[18px]">
          <p className={`${eyebrowClass} text-mkt-muted`}>Included in the {planPrice}</p>
          <h2 className={`${headingClass} max-w-[900px]`}>The little things, handled.</h2>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-[24px] border border-mkt-rule bg-mkt-rule sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex min-h-[206px] flex-col gap-2.5 bg-mkt-navy p-7">
              <p className={`${displayClass} text-[22px] leading-tight font-extrabold tracking-[-0.01em]`}>{feature.title}</p>
              <p className="text-[16px] leading-normal font-medium text-mkt-muted">{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Addons() {
  const addons = getAddonRegistry().list().map((addon) => ({
    key: addon.key,
    title: addon.title,
    blurb: addon.blurb,
    priceCents: addon.priceCents,
    price: addon.priceCents ? `+${formatDollars(addon.priceCents)}/mo` : 'Free',
  }))
  return <AddonSwitches addons={addons} baseCents={PLAN.priceCents} />
}

const NOT_THIS = ['Lead gen', 'Dialers', 'Pipelines', 'Data entry']

export function PriceAndClose() {
  return (
    <>
      <section className="bg-mkt-navy text-mkt-white">
        <div className={sectionClass}>
          <h2 className={`${eyebrowClass} text-mkt-gold`}>What it isn&apos;t</h2>
          <ul className="flex flex-wrap gap-x-7 gap-y-2.5">
            {NOT_THIS.map((word) => (
              <li key={word} className="relative text-[clamp(36px,5vw,64px)] leading-tight font-extrabold tracking-[-0.02em] text-mkt-muted">
                {word}
                <span className="absolute top-1/2 right-[-4px] left-[-4px] h-[5px] -translate-y-1/2 rounded-[3px] bg-mkt-gold" />
              </li>
            ))}
          </ul>
          <p className="max-w-[560px] text-[20px] leading-normal font-medium text-mkt-soft-white">
            Not a CRM. Not lead gen. Not a newsletter builder. Nothing to keep up with.
          </p>
        </div>
      </section>
      <section id="price" className="relative border-y border-mkt-rule bg-mkt-inset text-mkt-white">
        <SurveyEtch />
        <div className="relative mx-auto grid w-full max-w-[1280px] items-end gap-12 px-[clamp(20px,4vw,48px)] py-[clamp(64px,9vw,112px)] lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-[clamp(120px,20vw,260px)] leading-[0.8] font-black tracking-[-0.035em] text-mkt-gold">{planPrice}</p>
            <p className="text-[22px] font-bold">
              a month. Up to {PLAN.contactLimit} homeowners. Cancel any month.
            </p>
          </div>
          <div className="flex flex-col items-start gap-5">
            <p className="max-w-[480px] text-[20px] leading-normal font-medium">
              For agents in California.
            </p>
            <Link className={goldCtaClass} href="/register">
              Start for {planPrice} a month
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
