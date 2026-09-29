import type { Lot } from '@/lib/types'
import { cn } from '@/lib/utils'

const LOT_W = 74
const LOT_H = 48
const GAP_X = 12
const PAD_X = 10
const LABEL_H = 22
const STREET_H = 30
const ROW_GAP = 8

function priceShort(n: number) {
  return `$${(n / 1000).toFixed(0)}k`
}

export function ParcelMap({
  lots,
  streetName = 'Oakdale Ave',
  animated = false,
  className,
  ariaLabel,
}: {
  lots: Lot[]
  streetName?: string
  animated?: boolean
  className?: string
  ariaLabel?: string
}) {
  const maxCol = Math.max(0, ...lots.map((l) => l.col))
  const cols = maxCol + 1
  const width = PAD_X * 2 + cols * LOT_W + (cols - 1) * GAP_X

  const topRowY = LABEL_H
  const streetY = topRowY + LOT_H + ROW_GAP
  const bottomRowY = streetY + STREET_H + ROW_GAP
  const height = bottomRowY + LOT_H + LABEL_H

  const xForCol = (col: number) => PAD_X + col * (LOT_W + GAP_X)

  let popIndex = 0

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('h-auto w-full max-w-full', className)}
      role="img"
      aria-label={
        ariaLabel ??
        `Street plan of ${streetName} with the client\u2019s lot highlighted and recent recorded sales marked`
      }
    >
      {/* street band */}
      <rect
        x={0}
        y={streetY}
        width={width}
        height={STREET_H}
        className="fill-surface"
      />
      <line
        x1={0}
        y1={streetY + STREET_H / 2}
        x2={width}
        y2={streetY + STREET_H / 2}
        strokeDasharray="10 8"
        className="stroke-line"
        strokeWidth={2}
      />
      <text
        x={width - PAD_X}
        y={streetY + STREET_H / 2 + 4}
        textAnchor="end"
        className="fill-muted-foreground text-[11px] font-[560] uppercase tracking-[0.08em]"
      >
        {streetName}
      </text>

      {lots.map((lot) => {
        const x = xForCol(lot.col)
        const y = lot.row === 0 ? topRowY : bottomRowY
        const delay = animated ? `${popIndex++ * 90}ms` : undefined
        const popClass = animated
          ? 'origin-center animate-in fade-in zoom-in-90 fill-mode-backwards motion-reduce:animate-none'
          : undefined

        const isClient = lot.kind === 'client'
        const isSold = lot.kind === 'sold'

        return (
          <g
            key={lot.id}
            className={popClass}
            style={delay ? { animationDelay: delay } : undefined}
          >
            {isSold && lot.price != null && (
              <text
                x={x + LOT_W / 2}
                y={lot.row === 0 ? topRowY - 7 : bottomRowY + LOT_H + 16}
                textAnchor="middle"
                className="fill-coral text-[12px] font-[620]"
              >
                {priceShort(lot.price)}
              </text>
            )}
            <rect
              x={x}
              y={y}
              width={LOT_W}
              height={LOT_H}
              rx={8}
              className={cn(
                isClient && 'fill-blue',
                isSold && 'fill-coral-soft stroke-coral',
                !isClient && !isSold && 'fill-white stroke-line',
              )}
              strokeWidth={isSold ? 2 : 1.5}
            />
            {isClient && (
              <text
                x={x + LOT_W / 2}
                y={y + LOT_H / 2 + 4}
                textAnchor="middle"
                className="fill-white text-[11px] font-[620]"
              >
                You
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
