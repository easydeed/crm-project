import { barButtonClass, buttonClass, linkBaseClass } from '@/app/app/people/ui'
import { formatDollars, PLAN } from '@/config/costs'

/**
 * The marketing page's shared styles (OR-053). Archivo is the page's display face and nothing
 * else's: this is the only file outside the fonts and globals.css that names it, and only the
 * marketing files import this one (design-scope.test.ts holds both).
 *
 * Words are 15px and up. Gold is words only on the bar, and a mark anywhere else. Nothing on
 * --cream is muted. Every link and button takes a shared class and `.tap`.
 */
export const displayClass = 'font-display'

/** The plan price, from the one place a price may live. */
export const planPrice = formatDollars(PLAN.priceCents)

export const sectionClass = 'mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:gap-12 sm:px-8 sm:py-24'

export const eyebrowClass = `${displayClass} text-[15px] font-bold uppercase tracking-[0.1em]`

export const headingClass = `${displayClass} text-[40px] font-black leading-[0.95] tracking-[-0.025em] sm:text-[72px]`

export const cardTitleClass = `${displayClass} text-[26px] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-[30px]`

export const bodyClass = 'text-[17px] leading-relaxed'

/** A link on the navy bar: the shared link shape in the bar's words. */
export const barLinkClass = `tap ${linkBaseClass} font-semibold text-on-bar`

/** The primary action on the bar, and on the page. */
export const barCtaClass = `${barButtonClass} tap inline-flex items-center justify-center`
export const ctaClass = `${buttonClass} tap inline-flex items-center justify-center self-start`
