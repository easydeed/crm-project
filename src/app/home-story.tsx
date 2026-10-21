import { displayClass } from '@/app/marketing/ui'
import { Hero } from '@/app/marketing/hero'
import { HowItWorks } from '@/app/marketing/how'
import { Addons, Features, PriceAndClose } from '@/app/marketing/plan'
import { SiteFooter, SiteHeader } from '@/app/marketing/site-chrome'
import { WhatItIs } from '@/app/marketing/story'
import { TheNote } from '@/app/marketing/the-note'
import { WhyToCall } from '@/app/marketing/why'
import type { CanonicalFacts } from '@/digest/canonical-facts'
import type { DigestResult } from '@/digest/types'

/**
 * The marketing page (OR-054, Landing Page v6 plus the patch). Every figure comes from `facts`,
 * the real email, the signal fixtures, the add-on registry, or costs.ts.
 */
export function HomeStory({ facts, digest }: { facts: CanonicalFacts; digest: DigestResult }) {
  return (
    <div className={`mkt-page ${displayClass} bg-mkt-navy font-medium text-mkt-white`}>
      <SiteHeader onHome />
      <main>
        <Hero />
        <WhatItIs />
        <HowItWorks />
        <WhyToCall facts={facts} />
        <TheNote facts={facts} digest={digest} />
        <Features />
        <Addons />
        <PriceAndClose />
      </main>
      <SiteFooter />
    </div>
  )
}
