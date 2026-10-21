import Link from 'next/link'
import { ctaClass, eyebrowClass, headingClass } from '@/app/marketing/ui'
import { fullScenario, type CanonicalFacts } from '@/digest/canonical-facts'
import type { DigestResult } from '@/digest/types'

const labelClass = 'font-mono text-[15px] font-semibold tracking-[0.06em] text-mkt-secondary uppercase'

/**
 * The real email, inside the paper frame. The deed card quotes the same document the email does,
 * without an APN line.
 */
export function TheNote({ facts, digest }: { facts: CanonicalFacts; digest: DigestResult }) {
  const input = fullScenario().input
  const month = input.asOf.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
  const record: Array<[string, string]> = [
    ['Instrument', facts.deed.instrument],
    ['Recorded', facts.deed.recorded],
    ['Document no.', facts.deed.document],
    ['Consideration', facts.deed.amount],
  ]
  return (
    <section id="sample" className="bg-mkt-cream text-mkt-paper-ink">
      <div className="mx-auto grid w-full max-w-[1280px] items-start gap-14 px-[clamp(20px,4vw,48px)] py-[clamp(64px,9vw,112px)] lg:grid-cols-2">
        <div className="flex flex-col gap-[22px]">
          <h2 className={`${headingClass} text-mkt-navy`}>The note they actually open.</h2>
          <p className="max-w-[480px] text-[20px] leading-normal font-medium text-mkt-brown">
            It&apos;s about their house, not your listings. Your name and number sit at the bottom.
          </p>
          <Link className={ctaClass} href="/sample">
            Read the full sample
          </Link>
          <p className={`${eyebrowClass} mt-4 text-mkt-navy`}>What it&apos;s built from</p>
          <div className="relative flex max-w-[440px] -rotate-[1.5deg] flex-col gap-3.5 rounded-[6px] border border-mkt-paper-border bg-mkt-white px-5 pt-[18px] pb-5 text-mkt-paper-ink shadow-[var(--mkt-deed-shadow)]">
            <p className={labelClass}>County Recorder · Official Records</p>
            <p className="font-mono text-[16px] leading-snug font-semibold">
              {facts.address}
              <br />
              <span className="text-mkt-secondary">
                {facts.city} {facts.zip}
              </span>
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-mkt-paper-rule pt-3.5 font-mono text-[15px] font-medium">
              {record.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className={labelClass}>{label}</dt>
                  <dd className={label === 'Consideration' ? 'font-semibold' : undefined}>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="absolute top-12 right-[18px] -rotate-[9deg] rounded border-2 border-mkt-stamp px-[9px] py-[5px] font-mono text-[15px] font-bold tracking-[0.1em] text-mkt-stamp">
              RECORDED
            </p>
          </div>
        </div>
        {digest.send ? (
          <div className="w-full max-w-[540px] justify-self-center rounded-[6px] border border-mkt-paper-border bg-mkt-white shadow-[var(--mkt-paper-shadow)]">
            <div className="flex items-center justify-between gap-3 border-b border-mkt-paper-border px-7 py-[22px]">
              <span className="text-[15px] font-semibold tracking-[0.06em] text-mkt-brown uppercase">
                On the record · {month}
              </span>
              <span className="text-[15px] font-semibold tracking-[0.06em] text-mkt-brown uppercase">
                {input.agent.name}
              </span>
            </div>
            <iframe title="Email preview" sandbox="" srcDoc={digest.html} className="h-[640px] w-full bg-mkt-white" />
          </div>
        ) : null}
      </div>
    </section>
  )
}
