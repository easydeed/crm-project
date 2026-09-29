import { cn } from '@/lib/utils'

/**
 * Renders required MLS source attribution. Any block built from active
 * listing data (not county-recorded documents) must show this.
 */
export function MlsAttribution({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'flex items-center gap-1.5 text-[12px] leading-relaxed text-muted-foreground',
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-4 shrink-0 place-items-center rounded-[3px] bg-ink text-[9px] font-[700] text-white"
      >
        M
      </span>
      <span>
        Listing data courtesy of CRMLS. Information deemed reliable but not
        guaranteed.
      </span>
    </p>
  )
}
