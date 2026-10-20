import { CALL_TAGS } from '@/app/app/call-tags'
import { bodyClass, cardTitleClass, displayClass, eyebrowClass, headingClass, sectionClass } from '@/app/marketing/ui'

const cardClass = 'flex flex-col gap-4 rounded-3xl p-6 sm:p-10'

/** What the homeowner gets and what the agent gets. Recorded facts and the MLS listing stay apart. */
export function WhatItIs() {
  return (
    <section className="bg-background text-foreground">
      <div className={sectionClass}>
        <div className="flex flex-col gap-4">
          <p className={`${eyebrowClass} text-muted-ink`}>What it is</p>
          <h2 className={`${headingClass} max-w-5xl`}>One email a month. Three names to call. That&apos;s the whole thing.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className={`${cardClass} bg-surface`}>
            <p className={`${eyebrowClass} text-muted-ink`}>The people on your list get</p>
            <p className={cardTitleClass}>A short note about their own house, sent in your name.</p>
            <p className={bodyClass}>
              What sold on their street and what the county taxes them on, from the public record. A
              house nearby that&apos;s for sale now, from the MLS, when there is one. Never a guess at
              what their home is worth.
            </p>
          </div>
          <div className={`${cardClass} bg-bar text-on-bar`}>
            <p className={`${eyebrowClass} text-gold`}>You get</p>
            <p className={cardTitleClass}>Up to three names worth a call, with the reason and their number.</p>
            <p className={bodyClass}>
              Open it, tap Call, mark it done. Some months it&apos;s fewer than three. We don&apos;t pad the list.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  {
    title: 'Add your people',
    body: 'Upload the list from your old CRM or a spreadsheet. Or type your MLS ID and pick the homes you sold: those notes go to whoever lives there now.',
  },
  {
    title: 'We find every house',
    body: 'Each address is matched to the county record. You check the few we weren’t sure about.',
  },
  {
    title: 'It sends. You call.',
    body: 'Your note goes out on the day you pick. Up to three names show up on your home screen.',
  },
]

export function HowItWorks() {
  return (
    <section className="bg-cream text-foreground">
      <div className={sectionClass}>
        <h2 className={headingClass}>
          Set it up once.{' '}
          <span className="underline decoration-gold decoration-[6px] underline-offset-[10px]">Then it runs every month.</span>
        </h2>
        <ol className="grid gap-4 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className={`${cardClass} bg-bar text-on-bar`}>
              <span aria-hidden="true" className={`${displayClass} text-[64px] font-black leading-none text-gold`}>
                {index + 1}
              </span>
              <p className={cardTitleClass}>{step.title}</p>
              <p className={bodyClass}>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** The three reasons, named by the call list's own tags. "Been a while" is the fallback, not a reason. */
const REASONS = [
  { kind: 'sold_nearby', title: 'A house on their street just sold.', body: 'They’ll want to know. You get to tell them.' },
  { kind: 'loan_paid_off', title: 'The county recorded their loan as paid.', body: 'Something changed with their money this month.' },
  { kind: 'tax_upside', title: 'Taxed far below what their street sells for.', body: 'A conversation most agents never start.' },
] as const

export function WhyToCall() {
  return (
    <section className="bg-background text-foreground">
      <div className={sectionClass}>
        <h2 className={`${headingClass} max-w-4xl`}>Every name comes with a reason.</h2>
        <ul className="grid gap-4 lg:grid-cols-3">
          {REASONS.map((reason) => (
            <li key={reason.kind} className={`${cardClass} bg-bar text-on-bar`}>
              <p className={`${eyebrowClass} text-gold`}>{CALL_TAGS[reason.kind].label}</p>
              <p className={cardTitleClass}>{reason.title}</p>
              <p className={bodyClass}>{reason.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
