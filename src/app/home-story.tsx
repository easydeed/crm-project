import { Hero } from '@/app/marketing/hero'
import { Addons, Features, PriceAndClose } from '@/app/marketing/plan'
import { SiteFooter, SiteHeader } from '@/app/marketing/site-chrome'
import { HowItWorks, WhatItIs, WhyToCall } from '@/app/marketing/story'
import { TheNote } from '@/app/marketing/the-note'
import type { CanonicalFacts } from '@/digest/canonical-facts'
import type { DigestResult } from '@/digest/types'

/**
 * The marketing page (OR-053, from the Claude design's Landing Page v6, audited in OR-052). Every
 * figure on it comes from `facts` (canonicalFacts()), the real email (`digest`), the signal
 * fixtures (sample-calls.ts), the add-on registry or costs.ts. None is typed in.
 */
export function HomeStory({ facts, digest }: { facts: CanonicalFacts; digest: DigestResult }) {
  return (
    <>
      <div className="bg-bar text-on-bar">
        <SiteHeader onHome />
      </div>
      <main>
        <div className="bg-bar text-on-bar">
          <Hero />
        </div>
        <WhatItIs />
        <HowItWorks />
        <WhyToCall />
        <TheNote facts={facts} digest={digest} />
        <Features />
        <Addons />
        <PriceAndClose />
      </main>
      <SiteFooter />
    </>
  )
}
