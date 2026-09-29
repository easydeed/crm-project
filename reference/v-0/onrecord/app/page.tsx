import { MarketingHeader } from '@/components/marketing/marketing-header'
import { Hero } from '@/components/marketing/hero'
import { ProofBand } from '@/components/marketing/proof-band'
import { InboxPreview } from '@/components/marketing/inbox-preview'
import { CallList } from '@/components/marketing/call-list'
import { WhyOpen } from '@/components/marketing/why-open'
import { ReachAddons } from '@/components/marketing/reach-addons'
import { DoesntDo } from '@/components/marketing/doesnt-do'
import { PriceCompare } from '@/components/marketing/price-compare'
import { PricingLines } from '@/components/marketing/pricing-lines'
import { SetupSteps } from '@/components/marketing/setup-steps'
import { ClosingCta } from '@/components/marketing/closing-cta'
import { MarketingFooter } from '@/components/marketing/marketing-footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />
      <main>
        <Hero />
        <ProofBand />
        <InboxPreview />
        <CallList />
        <WhyOpen />
        <ReachAddons />
        <DoesntDo />
        <PriceCompare />
        <PricingLines />
        <SetupSteps />
        <ClosingCta />
      </main>
      <MarketingFooter />
    </div>
  )
}
