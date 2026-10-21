import { bodyClass, cardTitleClass, eyebrowClass, sectionClass } from '@/app/marketing/ui'

const cardClass = 'flex flex-col gap-4 rounded-[24px] p-[clamp(24px,3vw,40px)]'

/** What the homeowner gets and what the agent gets. The listing stays an MLS fact, not a county record. */
export function WhatItIs() {
  return (
    <section className="bg-mkt-white text-mkt-navy">
      <div className={sectionClass}>
        <div className="flex flex-col gap-[18px]">
          <p className={`${eyebrowClass} text-mkt-secondary`}>What it is</p>
          <h2 className="max-w-[1000px] text-[clamp(40px,6vw,80px)] leading-[0.95] font-black tracking-[-0.025em]">
            One email a month. Three names to call. That&apos;s the whole thing.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className={`${cardClass} bg-mkt-surface`}>
            <p className={`${eyebrowClass} text-mkt-secondary`}>The people on your list get</p>
            <p className={cardTitleClass}>A short note about their own house, sent in your name.</p>
            <p className={`${bodyClass} text-mkt-body`}>
              What sold on their street and what the county taxes them on, from the public record. A
              house nearby that&apos;s for sale now, from the MLS, when there is one. Never a guess at
              what their home is worth.
            </p>
          </div>
          <div className={`${cardClass} bg-mkt-navy text-mkt-white`}>
            <p className={`${eyebrowClass} text-mkt-muted`}>You get</p>
            <p className={cardTitleClass}>Three names worth a call, with the reason and the number.</p>
            <p className={`${bodyClass} text-mkt-pale`}>
              Open it, tap Call, mark it done. Some months it&apos;s fewer than three. We don&apos;t pad the list.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
