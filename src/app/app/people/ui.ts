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

/** The send card on /app: one message, at most one action. No figures, counts or tiles. */
export const sendCardClass = 'mx-4 mt-6 max-w-2xl rounded-xl border border-rule bg-background px-5 py-6'
