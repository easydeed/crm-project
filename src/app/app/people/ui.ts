export const linkClass =
  'text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

export const buttonClass =
  'rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-60'

export const fieldClass =
  'mt-1 w-full max-w-sm rounded-md border border-border bg-background px-3 py-2 text-[15px] text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

export const mutedClass = 'text-[15px] text-muted-ink'

/** Destructive action: coral words on an outline, so it never looks like the primary button. */
export const destructiveButtonClass =
  'rounded-md border border-border bg-background px-4 py-2 text-[15px] text-coral-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-60'

/** The send card on /app: one message, at most one action. No figures, counts or tiles. */
export const sendCardClass = 'mx-4 mt-6 max-w-2xl rounded-lg border border-rule bg-background px-5 py-6'
