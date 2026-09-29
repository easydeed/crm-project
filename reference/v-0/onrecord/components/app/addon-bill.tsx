'use client'

import { useStore, BILLING } from '@/lib/store'
import { currency } from '@/lib/format'

export function AddonBill() {
  const { addons, textingStatus, textsUsed } = useStore()

  const lines: { label: string; sub?: string; amount: number }[] = [
    { label: 'Monthly note', amount: 19 },
  ]

  for (const a of addons) {
    if (a.tier === 'extra' && a.enabled) {
      lines.push({ label: a.title, amount: a.priceValue })
    }
  }

  let textingOverage = 0
  if (textingStatus === 'active') {
    const over = Math.max(0, textsUsed - BILLING.textCap)
    textingOverage = (over * BILLING.overageCents) / 100
    lines.push({
      label: 'Text my clients',
      sub:
        over > 0
          ? `${textsUsed} of ${BILLING.textCap} used \u00b7 ${over} extra texts, ${currency(textingOverage)} this month`
          : `${textsUsed} of ${BILLING.textCap} texts used`,
      amount: 9,
    })
  }

  const total = lines.reduce((s, l) => s + l.amount, 0) + textingOverage

  return (
    <div className="mt-8 overflow-hidden rounded-2xl bg-ink text-white">
      <div className="px-5 pt-5">
        <h2 className="text-[13px] font-[560] uppercase tracking-[0.08em] text-white/60">
          Your bill
        </h2>
      </div>
      <dl className="mt-3 px-5">
        {lines.map((l, i) => (
          <div
            key={l.label}
            className={
              i === 0
                ? 'flex items-baseline justify-between py-2'
                : 'flex items-baseline justify-between border-t border-white/10 py-2'
            }
          >
            <div className="min-w-0">
              <dt className="text-[14.5px] font-[540]">{l.label}</dt>
              {l.sub && (
                <dd className="mt-0.5 text-[12.5px] text-white/55">{l.sub}</dd>
              )}
            </div>
            <dd className="shrink-0 pl-4 text-[14.5px] font-[560] tabular-nums">
              {currency(l.amount)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mx-5 mt-1 border-t border-white/25" />
      <div className="flex items-baseline justify-between px-5 py-3">
        <span className="text-[15px] font-[680]">Total</span>
        <span className="text-[20px] font-[680] tabular-nums">
          {currency(total)}
        </span>
      </div>
      <div className="border-t border-white/10 px-5 py-3 text-[12.5px] text-white/55">
        Next charge {BILLING.nextCharge} {'\u00b7'} {BILLING.card}
      </div>
    </div>
  )
}
