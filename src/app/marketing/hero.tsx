import Link from 'next/link'
import { SurveyEtch } from '@/app/marketing/etch'
import { HeroCards } from '@/app/marketing/hero-cards'
import { sampleCalls } from '@/app/marketing/sample-calls'
import { eyebrowClass, heroCtaClass, navLinkClass, planPrice } from '@/app/marketing/ui'

/** The opening, on navy, with the sample calls as the fan. */
export function Hero() {
  return (
    <section className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-[clamp(20px,4vw,48px)] pt-[clamp(48px,8vw,96px)] pb-[clamp(64px,9vw,112px)] lg:grid-cols-2">
      <SurveyEtch />
      <div className="relative flex flex-col gap-7">
        <p className={`${eyebrowClass} text-mkt-muted`}>For California agents · {planPrice} a month</p>
        <h1 className="text-[clamp(72px,11vw,152px)] leading-[0.86] font-black tracking-[-0.03em]">
          Three
          <br />
          calls.
        </h1>
        <p className="max-w-[540px] text-[clamp(19px,2vw,24px)] leading-[1.35] font-medium text-mkt-soft-white">
          Every month, onrecord emails the people on your list about their own house, using what the county
          recorded. Then it tells you which three of them to call, and why.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link className={heroCtaClass} href="/register">
            Start for {planPrice} a month
          </Link>
          <Link className={`${navLinkClass} px-[14px] py-5 text-[17px] font-bold text-mkt-white underline underline-offset-[5px]`} href="#how">
            How it works
          </Link>
        </div>
      </div>
      <HeroCards calls={sampleCalls()} />
    </section>
  )
}
