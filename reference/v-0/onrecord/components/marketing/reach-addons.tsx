import { SectionHeading } from './section-heading'
import { Reveal } from './scroll-fx'
import { SetAndForget } from './set-and-forget'

function PriceChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-blue/20 bg-blue/[0.07] px-2.5 py-1 font-mono text-[12px] font-[620] text-blue">
      {children}
    </span>
  )
}

const WEEKLY_EMAILS = [
  {
    subject: 'Two homes listed on Oakdale this week',
    excerpt:
      'Both within three doors of you. Here is what they are asking and how it compares to your last recorded value.',
  },
  {
    subject: '1187 Oakdale went pending \u2014 6 days on market',
    excerpt:
      'The one I mentioned last week already has an accepted offer. Quick read on what that means for your street.',
  },
  {
    subject: 'Rates moved. Here is what that does to a payment on your street.',
    excerpt:
      'A half point either way changes the math for buyers looking at homes like yours. The short version, in plain numbers.',
  },
]

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-[15px] leading-relaxed text-ink">
      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />
      <span>{children}</span>
    </li>
  )
}

export function ReachAddons() {
  return (
    <section id="add-ons" className="scroll-mt-20 bg-surface py-20">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <SectionHeading
            eyebrow="When once a month isn't enough"
            title="Reach further, only if you want to"
          />
          <p className="mx-auto mt-4 max-w-2xl text-balance text-center text-[16px] leading-relaxed text-muted-foreground">
            The monthly note is the whole product. Everything below is a switch.
            They start off. Flip one on when you want it, flip it off when you
            don&apos;t.
          </p>
        </Reveal>

        {/* B2 — Weekly market note: copy left, visual right */}
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <div className="flex items-center gap-3">
              <h3 className="text-balance text-[24px] font-[680] tracking-[-0.02em] text-ink sm:text-[28px]">
                A short one on Tuesdays, too
              </h3>
              <PriceChip>+$4/mo</PriceChip>
            </div>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted-foreground">
              A quick note each week. What went up for sale nearby, what sold,
              what changed on their street. We write it. We send it. If somebody
              gets tired of the weekly one, they can stop it and still get the
              monthly.
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              <Bullet>We write it {'\u2014'} you don&apos;t</Bullet>
              <Bullet>They can quit the weekly and keep the monthly</Bullet>
              <Bullet>Turn it off any month</Bullet>
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative mx-auto max-w-md lg:ml-auto lg:mr-0">
              {WEEKLY_EMAILS.map((mail, i) => (
                <div
                  key={mail.subject}
                  className="rounded-xl border border-line bg-white p-4 shadow-[0_20px_50px_-38px_rgba(14,23,41,0.5)]"
                  style={{
                    marginTop: i === 0 ? 0 : '-0.5rem',
                    marginLeft: `${i * 1.25}rem`,
                    marginRight: `${(2 - i) * 0.5}rem`,
                    position: 'relative',
                    zIndex: i,
                  }}
                >
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="h-6 w-6 rounded-full bg-blue/10 text-center font-serif text-[13px] font-[600] leading-6 text-blue">
                      o
                    </span>
                    <span className="font-[560] text-ink">
                      nrecord weekly
                    </span>
                    <span className="ml-auto font-mono">Tue</span>
                  </div>
                  <p className="mt-2.5 text-[14px] font-[620] leading-snug text-ink">
                    {mail.subject}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                    {mail.excerpt}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* B3 — Texting: visual left, copy right */}
        <div className="mt-24 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal className="order-2 lg:order-1">
            <PhoneFrame />
          </Reveal>

          <Reveal delay={120} className="order-1 lg:order-2">
            <h3 className="text-balance text-[24px] font-[680] tracking-[-0.02em] text-ink sm:text-[28px]">
              Two kinds of texting
            </h3>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted-foreground">
              Texting yourself is cheap. Texting your clients isn&apos;t{' '}
              {'\u2014'} the phone companies make us register first, and they
              charge us for every message. So we charge for them separately.
            </p>

            <div className="mt-6 flex flex-col gap-4">
              <div className="rounded-xl border border-line bg-white p-5 shadow-[0_18px_44px_-38px_rgba(14,23,41,0.45)]">
                <div className="flex items-center gap-3">
                  <h4 className="text-[16px] font-[680] text-ink">
                    Text me the call list
                  </h4>
                  <PriceChip>+$2/mo</PriceChip>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                  On the 1st, we text you the three names and why. You never open
                  anything.
                </p>
                <p className="mt-2 text-[13px] font-[560] text-ink/70">
                  Goes to your phone only.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-white p-5 shadow-[0_18px_44px_-38px_rgba(14,23,41,0.45)]">
                <div className="flex items-center gap-3">
                  <h4 className="text-[16px] font-[680] text-ink">
                    Text my clients
                  </h4>
                  <PriceChip>+$9/mo</PriceChip>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                  They can text you back instead of emailing. Or text one person,
                  or a whole group. 250 texts included, then 2{'\u00a2'} each.
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground/70">
                  The phone companies need 3 to 5 days to approve you. We do the
                  paperwork, you sign one form.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* B4 — Set and forget: full width */}
        <SetAndForget />
      </div>
    </section>
  )
}

function PhoneFrame() {
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="relative rounded-[2.5rem] border-[6px] border-ink/90 bg-ink p-2 shadow-[0_40px_90px_-50px_rgba(14,23,41,0.85)]">
        <div className="overflow-hidden rounded-[2rem] bg-white">
          {/* status bar */}
          <div className="flex items-center justify-between bg-white px-5 pb-1 pt-3 text-[11px] font-[620] text-ink">
            <span className="tabular-nums">9:41</span>
            <span aria-hidden className="flex items-center gap-1">
              <span className="h-2.5 w-3.5 rounded-[2px] border border-ink/40" />
              <span className="h-2 w-2 rounded-full bg-ink/40" />
            </span>
          </div>

          {/* contact header */}
          <div className="border-b border-line px-4 py-2.5 text-center">
            <p className="text-[14px] font-[680] text-ink">Marilyn Okafor</p>
            <p className="text-[11px] text-muted-foreground">
              1142 Oakdale Ave {'\u00b7'} owned 7 yrs
            </p>
          </div>

          {/* thread */}
          <div className="flex flex-col gap-2.5 bg-blue-soft/30 px-3 py-4">
            <div className="max-w-[80%] self-start rounded-2xl rounded-bl-md bg-line/70 px-3.5 py-2 text-[13px] leading-relaxed text-ink">
              Hi Dana {'\u2014'} is now a decent time to think about selling?
            </div>
            <div className="max-w-[82%] self-end rounded-2xl rounded-br-md bg-blue px-3.5 py-2 text-[13px] leading-relaxed text-white">
              Good time, actually. Two homes on your street closed above ask last
              month.
            </div>
            <div className="max-w-[80%] self-start rounded-2xl rounded-bl-md bg-line/70 px-3.5 py-2 text-[13px] leading-relaxed text-ink">
              Could we grab 15 minutes this week?
            </div>
            <p className="mt-1 text-center text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
              Reply STOP to opt out
            </p>
          </div>

          {/* composer */}
          <div className="flex items-center gap-2 border-t border-line bg-white px-3 py-2.5">
            <div className="h-8 flex-1 rounded-full border border-line bg-surface" />
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
