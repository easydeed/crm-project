import type { CSSProperties } from 'react'

const BOUNDARY = 'M120 150 L780 110 L820 470 L330 566 L92 452 Z'
const SETBACK = 'M152 182 L752 148 L786 452 L338 536 L128 438 Z'

// Tick marks along the top boundary, like a surveyor's stationing.
const TICKS = Array.from({ length: 12 }, (_, i) => {
  const t = i / 11
  const x = 120 + t * 660
  const y = 150 - t * 40
  return { x1: x, y1: y, x2: x, y2: y - 12 }
})

/**
 * A faint surveyor's-plat drawing used as a thematic backdrop: parcel
 * boundary, setback line, subdivided lots, bearings and a north arrow.
 * Grounded in the deed/record subject rather than generic decoration.
 */
export function SurveyPlat({
  className,
  style,
  animated = false,
}: {
  className?: string
  style?: CSSProperties
  animated?: boolean
}) {
  return (
    <svg
      viewBox="0 0 900 640"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={className}
      style={style}
    >
      <g stroke="currentColor" strokeWidth={1} opacity={0.45}>
        {TICKS.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
        ))}
      </g>

      <g stroke="currentColor" fill="none">
        <path
          d={BOUNDARY}
          strokeWidth={1.7}
          strokeLinejoin="round"
          className={animated ? 'plat-draw' : undefined}
          style={animated ? ({ ['--len']: 2700 } as CSSProperties) : undefined}
        />
        <path
          d={SETBACK}
          strokeWidth={1}
          strokeDasharray="5 7"
          opacity={0.6}
        />
        <path d="M312 150 L352 560" strokeWidth={1.1} opacity={0.75} />
        <path d="M560 126 L600 536" strokeWidth={1.1} opacity={0.75} />
        <path d="M104 300 L806 268" strokeWidth={1} opacity={0.4} />
      </g>

      <g transform="translate(816 96)">
        <circle r={24} stroke="currentColor" strokeWidth={1.2} fill="none" opacity={0.8} />
        <path d="M0 -16 L6 7 L0 2 L-6 7 Z" fill="currentColor" />
        <text
          x={0}
          y={19}
          textAnchor="middle"
          fontSize={11}
          fill="currentColor"
          letterSpacing={1}
        >
          N
        </text>
      </g>

      <g fill="currentColor" fontSize={12.5} letterSpacing={1.6} opacity={0.85}>
        <text x={150} y={132}>{"N 47°30' E   128.40'"}</text>
        <text x={372} y={352}>{'LOT 14'}</text>
        <text x={150} y={604}>{'TRACT NO. 2571'}</text>
        <text
          x={470}
          y={506}
          transform="rotate(-11 470 506)"
        >
          {"S 88°10' W   214.6'"}
        </text>
      </g>
    </svg>
  )
}
