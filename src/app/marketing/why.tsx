import { CALL_TAGS } from '@/app/app/call-tags'
import { bodyClass, cardTitleClass, eyebrowClass, headingClass, sectionClass } from '@/app/marketing/ui'
import type { CanonicalFacts } from '@/digest/canonical-facts'

const REASONS = [
  { kind: 'sold_nearby' as const, title: 'A house on their street just sold.', body: 'They’ll want to know. You get to tell them.', phrase: 'Sold,\nfour doors down' },
  { kind: 'loan_paid_off' as const, title: 'The county recorded their loan as paid.', body: 'Something changed with their money this month.', phrase: 'Reconveyance\nrecorded' },
]

/** The three reasons. The fourth card from the drawing is not a thing the product does. */
export function WhyToCall({ facts }: { facts: CanonicalFacts }) {
  return (
    <section className="bg-mkt-white text-mkt-navy">
      <div className={sectionClass}>
        <h2 className={`${headingClass} max-w-[900px]`}>Every name comes with a reason.</h2>
        <ul className="grid gap-4 lg:grid-cols-3">
          {REASONS.map((reason) => (
            <li key={reason.kind} className="flex flex-col gap-3.5 rounded-[24px] bg-mkt-navy px-3 pt-3 pb-[30px] text-mkt-cream">
              <div aria-hidden="true" className="flex h-[200px] items-end rounded-[16px] bg-mkt-inset p-6">
                <p className="text-[30px] leading-none font-extrabold whitespace-pre-line text-mkt-gold">{reason.phrase}</p>
              </div>
              <p className={`${eyebrowClass} px-[18px] text-mkt-gold`}>{CALL_TAGS[reason.kind].label}</p>
              <p className={`${cardTitleClass} px-[18px]`}>{reason.title}</p>
              <p className={`${bodyClass} px-[18px]`}>{reason.body}</p>
            </li>
          ))}
          <li className="flex flex-col gap-3.5 rounded-[24px] bg-mkt-navy px-3 pt-3 pb-[30px] text-mkt-cream">
            <div className="flex h-[200px] flex-col justify-center gap-3.5 rounded-[16px] bg-mkt-inset px-5">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-2.5 font-mono text-[15px] font-semibold tracking-[0.06em] text-mkt-pale uppercase">
                  <span>They&apos;re taxed on</span>
                  <span className="text-mkt-white">{facts.taxedOn}</span>
                </div>
                <div className="h-5 w-[79%] rounded-[5px] bg-mkt-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-2.5 font-mono text-[15px] font-semibold tracking-[0.06em] text-mkt-pale uppercase">
                  <span>A buyer today pays on</span>
                  <span className="text-mkt-white">{facts.streetMedian.replace(/^about /, '')}</span>
                </div>
                <div className="h-5 w-full rounded-[5px] bg-mkt-gold" />
              </div>
              <p className="text-[15px] leading-tight font-extrabold">
                {facts.benefit} a year they keep. Gone if they sell, unless they carry it.
              </p>
            </div>
            <p className={`${eyebrowClass} px-[18px] text-mkt-gold`}>{CALL_TAGS.tax_upside.label}</p>
            <p className={`${cardTitleClass} px-[18px]`}>Taxed far below what their street sells for.</p>
            <p className={`${bodyClass} px-[18px]`}>A conversation most agents never start.</p>
          </li>
        </ul>
      </div>
    </section>
  )
}
