import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SurveyPlat } from './survey-plat'
import { Parallax, Reveal } from './scroll-fx'

export function ClosingCta() {
  return (
    <section className="relative overflow-hidden bg-blue py-24 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <Parallax speed={0.35} className="absolute inset-x-0 -top-24 h-[160%]">
          <SurveyPlat
            className="plat-fade h-full w-full text-white"
            style={{ opacity: 0.14 }}
          />
        </Parallax>
      </div>

      <Reveal className="relative mx-auto max-w-2xl px-5 text-center">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] font-[560] uppercase tracking-[0.14em] text-white/70">
          <span className="size-1.5 rounded-full bg-green" />
          One setup. Every month after.
        </p>
        <h2 className="text-balance font-serif text-[34px] font-[560] leading-[1.04] tracking-[-0.01em] text-white sm:text-[46px]">
          Set it up once. Show up every month.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-pretty text-[16px] leading-relaxed text-white/65">
          Your past clients hear from you with something worth reading — pulled from
          the public record, sent in your name.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            nativeButton={false}
            render={<Link href="/register" />}
            className="h-12 w-full bg-white px-6 text-[16px] font-[620] text-ink [a]:hover:bg-white/90 sm:w-auto"
          >
            Start for $19 a month
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/sample" />}
            className="h-12 w-full border-white/25 bg-transparent px-6 text-[16px] font-[560] text-white [a]:hover:bg-white/10 sm:w-auto"
          >
            See a sample email
          </Button>
        </div>
      </Reveal>
    </section>
  )
}
