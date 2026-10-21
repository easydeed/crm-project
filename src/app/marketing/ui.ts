import { formatDollars, PLAN } from '@/config/costs'

/**
 * The marketing page's own classes (OR-054). Archivo is the body and the display face.
 * Mono is the eyebrows. Nothing here comes from app/people/ui.ts.
 */
export const displayClass = 'font-display'

export const planPrice = formatDollars(PLAN.priceCents)

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current'

export const sectionClass =
  'mx-auto flex w-full max-w-[1280px] flex-col gap-12 px-[clamp(20px,4vw,48px)] py-[clamp(64px,9vw,112px)]'

export const eyebrowClass = 'font-mono text-[15px] leading-[normal] font-medium uppercase tracking-[0.08em]'

export const headingClass =
  'font-display text-[clamp(44px,6.5vw,88px)] font-black leading-[0.92] tracking-[-0.025em]'

export const cardTitleClass =
  'font-display text-[clamp(26px,2.6vw,34px)] font-extrabold leading-[1.05] tracking-[-0.02em]'

export const bodyClass = 'font-display text-[17px] font-medium leading-normal'

export const navLinkClass = `tap mkt-nav inline-flex min-h-11 items-center px-3 py-3 font-display text-[15px] leading-[normal] font-medium text-mkt-muted ${focus}`

export const pillClass = `tap inline-flex min-h-11 items-center rounded-full bg-mkt-white px-[18px] py-3 font-display text-[15px] leading-[normal] font-bold text-mkt-navy ${focus}`

export const heroCtaClass = `tap mkt-lift inline-flex items-center justify-center rounded-[16px] bg-mkt-white px-[30px] py-5 font-display text-[18px] leading-[normal] font-extrabold text-mkt-navy ${focus}`

export const goldCtaClass = `tap mkt-lift inline-flex items-center justify-center self-start rounded-[16px] bg-mkt-gold px-[30px] py-5 font-display text-[18px] leading-[normal] font-extrabold text-mkt-navy ${focus}`

/** The sample page's button, and the "Read the full sample" button on cream. */
export const ctaClass = `tap mkt-lift inline-flex items-center justify-center self-start rounded-[14px] bg-mkt-navy px-[26px] py-[18px] font-display text-[17px] leading-[normal] font-extrabold text-mkt-cream ${focus}`

/** The drawn "Call" bar on a hero card: a picture of the button, not a control, so no focus or tap size. */
export const callBarClass = 'inline-flex h-[52px] items-center justify-center rounded-[12px] bg-mkt-navy font-display text-[16px] font-bold text-mkt-white'
