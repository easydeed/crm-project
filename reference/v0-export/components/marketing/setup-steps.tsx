import { SectionHeading } from './section-heading'
import { Reveal } from './scroll-fx'

const STEPS = [
  {
    n: '01',
    title: 'Add your people',
    body: "Send us a list, or just forward us your closing emails. We'll pull the names out.",
  },
  {
    n: '02',
    title: 'Check the matches',
    body: "We find each house in the county records. You glance at anything we couldn't find.",
  },
  {
    n: '03',
    title: 'It sends',
    body: 'The 1st of every month, forever. And you get your three names.',
  },
]

export function SetupSteps() {
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-5 py-16 scroll-mt-20">
      <Reveal>
        <SectionHeading
          eyebrow="Four minutes to set up"
          title="Three steps, then it runs"
        />
      </Reveal>

      <div className="relative mt-12">
        {/* connector line that draws across as the row reveals */}
        <Reveal
          aria-hidden
          className="absolute left-[8%] right-[8%] top-6 hidden sm:block"
        >
          <div className="draw-x h-px bg-gradient-to-r from-blue/30 via-blue/50 to-blue/30" />
        </Reveal>

        <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 150} className="relative text-center">
              {/* station dot on the line */}
              <div className="relative mx-auto flex h-12 items-center justify-center">
                <span className="relative z-10 grid size-12 place-items-center rounded-full border border-blue/25 bg-white shadow-[0_10px_24px_-14px_rgba(43,91,201,0.7)]">
                  <span className="size-2.5 rounded-full bg-blue" />
                </span>
              </div>

              {/* oversized serif numeral */}
              <p className="mt-4 font-serif text-[52px] font-[500] leading-none tracking-[-0.02em] text-blue/15">
                {s.n}
              </p>

              <h3 className="mt-2 text-[18px] font-[620] text-ink">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-[16rem] text-[15px] leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
