import Link from 'next/link'
import { DigestPreviewFrame } from '@/app/digest/preview-panel'
import { bodyClass, ctaClass, eyebrowClass, headingClass, sectionClass } from '@/app/marketing/ui'
import type { CanonicalFacts } from '@/digest/canonical-facts'
import type { DigestResult } from '@/digest/types'

/**
 * The note itself: the real email for the Oakdale house, rendered by the email renderer, beside the
 * recorded deed it is built from. Every figure comes from canonicalFacts(); the deed's price carries
 * its document number.
 */
export function TheNote({ facts, digest }: { facts: CanonicalFacts; digest: DigestResult }) {
  const record: Array<[string, string]> = [
    ['Document', facts.deed.instrument],
    ['Recorded', facts.deed.recorded],
    ['Document number', facts.deed.document],
    ['Price', facts.deed.amount],
  ]
  return (
    <section id="sample" className="bg-cream text-foreground">
      <div className={`${sectionClass} lg:grid lg:grid-cols-2 lg:items-start`}>
        <div className="flex flex-col gap-6">
          <h2 className={headingClass}>The note {facts.firstName} gets.</h2>
          <p className="max-w-lg text-[19px] leading-snug">
            It&apos;s about their house, not your listings. Your name sits at the bottom, and replies come to you.
          </p>
          <Link className={ctaClass} href="/sample">
            Read the full sample
          </Link>
          <div className="mt-4 flex max-w-md flex-col gap-4 rounded-xl border border-rule bg-background p-5">
            <p className={eyebrowClass}>From the county record</p>
            <p className={bodyClass}>
              {facts.address}, {facts.city} {facts.zip}
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-rule pt-4">
              {record.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="text-[15px] text-muted-ink">{label}</dt>
                  <dd className="text-[17px] font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        {digest.send ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-[17px] font-semibold">The sample note, as {facts.firstName} receives it</h3>
            <DigestPreviewFrame html={digest.html} text={digest.text} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
