import { Reveal } from './scroll-fx'

function PriceChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-blue/20 bg-blue/[0.07] px-2.5 py-1 font-mono text-[12px] font-[620] text-blue">
      {children}
    </span>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={[
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        on ? 'bg-blue' : 'bg-line',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
          on ? 'translate-x-[18px]' : 'translate-x-[2px]',
        ].join(' ')}
      />
    </span>
  )
}

const WHEN_CHIPS = [
  'A house near them goes up for sale',
  'Somebody on their street sells',
  "It's been a year since they bought",
  'They keep opening your emails',
]

const WHAT_CHIPS = [
  'Send them a note about it',
  'Text me so I can call',
  'Put them at the top of my call list',
]

const RULES = [
  {
    trigger: 'a house goes up for sale within three doors',
    action: 'send them \u201cA house just listed on your street.\u201d',
    status: 'On \u00b7 ran 14 times',
    on: true,
  },
  {
    trigger: 'a client pays off or refinances their loan',
    action: 'text me so I can call today.',
    status: 'On \u00b7 ran 3 times',
    on: true,
  },
  {
    trigger: "it's been a year since they bought",
    action: 'send \u201cOne year in your home.\u201d',
    status: 'Off',
    on: false,
  },
  {
    trigger: 'somebody opens three emails in a row',
    action: 'move them to the top of my call list.',
    status: 'On \u00b7 ran 9 times',
    on: true,
  },
]

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface/60 px-3.5 py-2.5 text-[14px] leading-snug text-ink">
      {children}
    </div>
  )
}

function Panel({
  n,
  label,
  children,
}: {
  n: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-[0_18px_44px_-40px_rgba(14,23,41,0.4)]">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-1 -top-4 font-serif text-[72px] font-[500] leading-none text-blue/[0.07]"
      >
        {n}
      </span>
      <p className="relative text-[11px] font-[620] uppercase tracking-[0.14em] text-blue">
        {label}
      </p>
      <div className="relative mt-4 flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

export function SetAndForget() {
  return (
    <>
      <Reveal>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <p className="text-[11px] font-[620] uppercase tracking-[0.16em] text-coral">
            Set and forget
          </p>
          <PriceChip>+$9/mo</PriceChip>
        </div>
        <h3 className="mt-3 text-balance text-center text-[26px] font-[680] tracking-[-0.02em] text-ink sm:text-[32px]">
          Tell it once. It just keeps doing it.
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-balance text-center text-[16px] leading-relaxed text-muted-foreground">
          Pick a thing that should happen, and when. That&apos;s it. No steps, no
          flowcharts, no building anything. It runs in the background whether you
          think about it or not.
        </p>
      </Reveal>

      {/* B1 — three-step visual with a flat connecting line behind the cards */}
      <div className="relative mt-12">
        <div
          aria-hidden
          className="absolute left-[16%] right-[16%] top-16 hidden h-px bg-line lg:block"
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <Reveal>
            <Panel n="1" label="Pick when">
              {WHEN_CHIPS.map((c) => (
                <Chip key={c}>{c}</Chip>
              ))}
            </Panel>
          </Reveal>
          <Reveal delay={120}>
            <Panel n="2" label="Pick what happens">
              {WHAT_CHIPS.map((c) => (
                <Chip key={c}>{c}</Chip>
              ))}
            </Panel>
          </Reveal>
          <Reveal delay={240}>
            <Panel n="3" label="Walk away">
              <div className="flex items-center gap-3">
                <Toggle on />
                <span className="text-[15px] font-[620] text-ink">On</span>
              </div>
              <p className="text-[14px] leading-relaxed text-muted-foreground">
                Ran 14 times since April. You did nothing.
              </p>
            </Panel>
          </Reveal>
        </div>
      </div>

      {/* B2 — the rules, plain sentences */}
      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
        {RULES.map((rule, i) => (
          <Reveal
            key={rule.trigger}
            delay={i * 90}
            className="rounded-xl border border-line bg-white p-5 shadow-[0_18px_44px_-40px_rgba(14,23,41,0.4)]"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-[16px] leading-relaxed text-ink">
                <span className="font-[620] text-muted-foreground">When </span>
                <span className="font-[620] text-coral">{rule.trigger}</span>{' '}
                <span aria-hidden className="text-muted-foreground">
                  {'\u2192'}
                </span>{' '}
                {rule.action}
              </p>
              <Toggle on={rule.on} />
            </div>
            <p className="mt-3 font-mono text-[12px] text-muted-foreground">
              {rule.status}
            </p>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <p className="mx-auto mt-8 max-w-xl text-balance text-center text-[14px] leading-relaxed text-muted-foreground">
          Every rule is one sentence. If it needs a paragraph to explain, we
          didn&apos;t build it.
        </p>
      </Reveal>

      {/* B3 — before / after, words carry it */}
      <Reveal delay={80} className="mx-auto mt-12 max-w-3xl">
        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-line">
            <div className="p-6 sm:p-7">
              <p className="text-[11px] font-[620] uppercase tracking-[0.14em] text-muted-foreground">
                Without it
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                You hear a neighbor sold. You mean to call. Three weeks go by.
                They list with somebody else.
              </p>
            </div>
            <div className="border-t border-line p-6 sm:border-t-0 sm:p-7">
              <p className="text-[11px] font-[620] uppercase tracking-[0.14em] text-blue">
                With it
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink">
                A house sells two doors down. Your client gets a note that
                morning. Your phone buzzes with their name. You call.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </>
  )
}
