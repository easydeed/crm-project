import { bodyClass } from '@/app/marketing/ui'

const cardClass = 'flex min-h-[280px] flex-col gap-3.5 rounded-[24px] bg-mkt-navy p-[30px] text-mkt-white'
const numeralClass = 'text-[72px] leading-[0.85] font-black tracking-[-0.03em] text-mkt-gold'
const titleClass = 'mt-1.5 text-[28px] leading-[1.02] font-extrabold tracking-[-0.02em]'
const monoRow = 'flex items-center justify-between gap-3 rounded-[12px] px-3.5 py-3 font-mono text-[15px] font-medium'

/** Set-up, drawn as the three vignettes. The match rows say Matched, not an APN. */
export function HowItWorks() {
  return (
    <section id="how" className="bg-mkt-cream text-mkt-navy">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-12 px-[clamp(20px,4vw,48px)] py-[clamp(64px,9vw,112px)]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="text-[clamp(56px,9vw,128px)] leading-[0.86] font-black tracking-[-0.03em]">
            Set it up once.
            <br />
            <span className="underline decoration-mkt-gold decoration-[10px] underline-offset-[14px]">Then done.</span>
          </h2>
          <p className="max-w-[360px] text-[20px] leading-snug font-bold">
            Add your people, check the few we weren&apos;t sure about, pick a day. Then it runs every month without you.
          </p>
        </div>
        <ol className="grid gap-4 lg:grid-cols-3">
          <li className={cardClass}>
            <span className={numeralClass}>1</span>
            <div className="mt-auto flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-dashed border-mkt-secondary p-4">
              <div className="flex justify-between gap-3 font-mono text-[15px] font-medium">
                <span>people.csv</span>
                <span className="text-mkt-muted">212 rows</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-mkt-rule">
                <div className="h-full w-[72%] bg-mkt-gold" />
              </div>
              <p className="font-mono text-[15px] font-medium text-mkt-muted">Reading names and addresses…</p>
            </div>
            <p className={titleClass}>Add your people</p>
            <p className={`${bodyClass} text-mkt-pale`}>
              Upload the list from your old CRM or a spreadsheet. Or type your MLS ID and pick the homes you sold;
              those notes go to whoever lives there now.
            </p>
          </li>
          <li className={cardClass}>
            <span className={numeralClass}>2</span>
            <div className="mt-auto flex flex-col gap-1.5">
              <div className={`${monoRow} bg-mkt-inset`}>
                <span>1142 Oakdale Ave</span>
                <span className="text-mkt-gold">Matched ✓</span>
              </div>
              <div className={`${monoRow} bg-mkt-inset`}>
                <span>88 Vista Del Sol</span>
                <span className="text-mkt-gold">Matched ✓</span>
              </div>
              <div className={`${monoRow} border-[1.5px] border-mkt-gold`}>
                <span>Unit 4, Palm Ct</span>
                <span>Which one? ›</span>
              </div>
            </div>
            <p className={titleClass}>We find every house</p>
            <p className={`${bodyClass} text-mkt-pale`}>
              Each address is matched to the county record. You check the few we weren&apos;t sure about.
            </p>
          </li>
          <li className={cardClass}>
            <span className={numeralClass}>3</span>
            <div className="mt-auto flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 rounded-[12px] bg-mkt-cream py-2.5 pr-2.5 pl-3.5 text-mkt-navy">
                <span className="text-[15px] font-extrabold">Elena Brooks</span>
                <span className="rounded-full bg-mkt-navy px-3 py-[7px] text-[15px] font-extrabold text-mkt-white">Call</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[12px] bg-mkt-cream py-2.5 pr-2.5 pl-3.5 text-mkt-navy">
                <span className="text-[15px] font-extrabold">Glenn Sato</span>
                <span className="rounded-full bg-mkt-navy px-3 py-[7px] text-[15px] font-extrabold text-mkt-white">Call</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[12px] bg-mkt-cream py-2.5 pr-2.5 pl-3.5 text-mkt-secondary">
                <span className="text-[15px] font-extrabold line-through">Ray Villanueva</span>
                <span className="px-1 py-[7px] font-mono text-[15px] font-semibold">Done</span>
              </div>
            </div>
            <p className={titleClass}>It sends. You call.</p>
            <p className={`${bodyClass} text-mkt-pale`}>
              Your note goes out on the day you pick. Up to three names show up on your home screen.
            </p>
          </li>
        </ol>
      </div>
    </section>
  )
}
