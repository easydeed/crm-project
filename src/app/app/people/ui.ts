/** A link's shape with no colour. A link that must stay ink (nav, filter chips) uses this and names its own colour. */
export const linkBaseClass =
  'text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

/**
 * A text link (OR-042): blue, 5.17:1 light and 7.55:1 dark on the page, 4.73 and 6.58 on --surface.
 * Never on --blue-soft (4.42:1). Ink links use linkBaseClass and name their colour; they never
 * override this one, because two text colours on one element are settled by stylesheet order.
 */
export const linkClass = linkBaseClass + ' text-blue'

/**
 * A control that will not respond: --surface fill, --muted-ink words, a --border ring (inset, so the
 * button keeps its size). Checked pairs, never opacity. Only for controls that are disabled; never
 * for a state the agent chose and can reverse, such as an add-on switched off (OR-021).
 */
export const disabledClass =
  'disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted-ink disabled:ring-1 disabled:ring-inset disabled:ring-border'

/** The primary button (OR-042): 48px, 17px semibold. */
export const buttonClass =
  'min-h-12 rounded-md bg-foreground px-6 py-2 text-[17px] font-semibold text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ' + disabledClass

/** An outlined button's shape: 48px, a 1.5px --border outline on the page. Colour comes from the class that uses it. */
const outlinedClass =
  'min-h-12 rounded-md border-[1.5px] border-border bg-background px-6 py-2 text-[17px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

/** A second action beside the primary one, e.g. "Not now" (OR-042). */
export const secondaryButtonClass = outlinedClass + ' text-foreground ' + disabledClass

/** A text input or select (OR-042): 48px, a 1.5px --border outline, 17px. */
export const fieldClass =
  'mt-1 block w-full max-w-sm min-h-12 rounded-md border-[1.5px] border-border bg-background px-3.5 py-2 text-[17px] text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

export const mutedClass = 'text-[15px] text-muted-ink'

/** Destructive action: coral words on an outline, so it never looks like the primary button. */
export const destructiveButtonClass = outlinedClass + ' text-coral-text ' + disabledClass

/**
 * A panel (OR-044), the design's "every grouping is a panel": a 1px --rule border, 12px radius, on
 * the page. Its title is the header strip below. OR-042 held this class back until a screen used it.
 */
export const panelClass = 'overflow-hidden rounded-xl border border-rule bg-background'

/** A panel's strip with no title type: search and filters sit in it on People (OR-045). */
export const panelStripClass = 'border-b border-rule bg-surface px-5 py-3.5 sm:px-6'

/** A panel's title strip: --surface, a --rule below, 19px semibold. Put it on the panel's heading. */
export const panelHeaderClass = panelStripClass + ' text-[19px] font-semibold'

/** A panel's body padding. */
export const panelBodyClass = 'px-5 py-5 sm:px-6'

/**
 * The send card on /app: the plain panel, with no strip. One message, at most one primary action
 * (OR-044: "Preview it" is the button, "Skip this month" a form button styled as a link). No
 * figures, counts or tiles.
 */
export const sendCardClass = 'rounded-xl border border-rule bg-background px-5 py-5.5 sm:px-7 sm:py-6.5'

/** The send card's one sentence: 22px, 24px from sm (OR-044). */
export const sendCardHeadingClass = 'text-[22px] font-semibold sm:text-[24px]'

/**
 * The bar's own controls (OR-045): the light pill pair, the same object as the current-page pill.
 * A page-background control vanishes on the dark bar (1.43:1); the pill is 17.9:1 light and 11.8:1
 * dark against it. Focus rings are --on-bar, which a ring in --foreground would not be on navy.
 */
const barControlShape =
  'min-h-12 rounded-md bg-bar-current px-6 py-2 text-[17px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-bar'

/** A button on the bar. */
export const barButtonClass = barControlShape + ' text-on-bar-current ' + disabledClass

/** Delete on the bar: the pill with coral words (--on-bar-danger, 6.31:1 light, 5.39:1 dark). Never a coral fill. */
export const barDestructiveButtonClass = barControlShape + ' text-on-bar-danger ' + disabledClass

/** A select or input on the bar. */
export const barFieldClass =
  'mt-1 block w-full max-w-sm min-h-12 rounded-md bg-bar-current px-3.5 py-2 text-[17px] text-on-bar-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-bar ' +
  disabledClass
