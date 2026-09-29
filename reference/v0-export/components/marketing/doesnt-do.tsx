import { Reveal } from './scroll-fx'

const CROSSED = ['Lead gen', 'Dialers', 'Pipeline stages', 'Data entry', 'Daily logins']

export function DoesntDo() {
  return (
    <section className="bg-ink py-20 text-white">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal>
          <p className="text-[11px] font-[620] uppercase tracking-[0.16em] text-coral">
            What it isn&apos;t
          </p>
          <h2 className="mt-3 max-w-2xl text-balance font-serif text-[34px] font-[560] leading-[1.04] tracking-[-0.01em] sm:text-[46px]">
            Still nothing to maintain
          </h2>
        </Reveal>

        <ul className="mt-10 flex flex-col gap-1">
          {CROSSED.map((word, i) => (
            <Reveal
              as="li"
              key={word}
              delay={i * 110}
              className="group flex items-center"
            >
              <span className="relative inline-block py-1">
                <span className="font-serif text-[30px] font-[500] leading-tight text-white/45 sm:text-[42px]">
                  {word}
                </span>
                <span
                  aria-hidden
                  className="strike absolute left-0 top-1/2 h-[3px] w-full rounded-full bg-coral"
                  style={{ transitionDelay: `${i * 110 + 220}ms` }}
                />
              </span>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={160}>
          <p className="mt-10 max-w-md text-[16px] leading-relaxed text-white/70">
            Turn every switch on and there&apos;s still nothing to keep up with.
            No list to clean. No boxes to check. Nothing waiting for you when you
            log in. It sends things. It doesn&apos;t hand you a to-do list.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
