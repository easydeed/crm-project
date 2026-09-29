import type { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="sticky top-14 z-30 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-end justify-between gap-4 px-5 py-5 sm:px-8">
        <div className="min-w-0">
          <h1 className="text-[22px] font-[680] tracking-[-0.02em] text-ink sm:text-[26px]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-[14px] text-muted-foreground text-pretty">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  )
}
