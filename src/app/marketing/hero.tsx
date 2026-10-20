import Link from 'next/link'
import { CALL_TAGS } from '@/app/app/call-tags'
import { sampleCalls } from '@/app/marketing/sample-calls'
import { barCtaClass, barLinkClass, bodyClass, displayClass, eyebrowClass, planPrice, sectionClass } from '@/app/marketing/ui'

/**
 * The opening, on the bar. The cards are a sample call list made by the real signal code
 * (sample-calls.ts): each sentence is the one the call list would show for that house. They are a
 * picture of the list, not controls, so nothing on them responds to a tap or a hover.
 */
export function Hero() {
  return (
    <section className={`${sectionClass} lg:grid lg:grid-cols-[1.15fr_1fr] lg:items-center`}>
      <div className="flex flex-col gap-7">
        <p className={`${eyebrowClass} text-gold`}>For California agents · {planPrice} a month</p>
        <h1 className={`${displayClass} text-[72px] font-black leading-[0.86] tracking-[-0.03em] sm:text-[128px]`}>
          Three
          <br />
          calls.
        </h1>
        <p className="max-w-xl text-[19px] leading-snug sm:text-[22px]">
          Every month, onrecord emails the people on your list about their own house, from the county
          record. Then it tells you which three of them to call, and why.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link className={barCtaClass} href="/register">
            Start for {planPrice} a month
          </Link>
          <Link className={barLinkClass} href="/sample">
            See the sample note
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold">A sample call list</h2>
        <ol className="flex flex-col gap-3">
          {sampleCalls().map((call, index) => (
            <li key={call.kind} className="flex flex-col gap-3 rounded-3xl bg-gold p-5 text-on-gold sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span aria-hidden="true" className={`${displayClass} text-[40px] font-black leading-none`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={`rounded-full px-3 py-1.5 text-[15px] font-semibold ${CALL_TAGS[call.kind].className}`}>
                  {call.tag}
                </span>
              </div>
              <p className={`${displayClass} text-[26px] font-extrabold leading-tight tracking-[-0.02em]`}>{call.address}</p>
              <p className={bodyClass}>{call.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
