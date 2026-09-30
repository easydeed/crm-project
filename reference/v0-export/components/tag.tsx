import { cn } from '@/lib/utils'

export type Tone = 'green' | 'coral' | 'blue' | 'grey'

const TONES: Record<Tone, string> = {
  green: 'bg-[#e7f6ef] text-green',
  coral: 'bg-coral-soft text-coral',
  blue: 'bg-blue-soft text-blue',
  grey: 'bg-surface text-muted-foreground',
}

export function Tag({
  tone = 'grey',
  children,
  className,
  dot = false,
}: {
  tone?: Tone
  children: React.ReactNode
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-[560] whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-current"
        />
      )}
      {children}
    </span>
  )
}
