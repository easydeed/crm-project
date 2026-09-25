'use client'

import { useState } from 'react'
import { AddonRow } from '@/app/app/addons/addon-row'
import { BillBar } from '@/app/app/addons/bill-bar'
import { BANDS, EMPTY_STATE, type AddonRowData } from '@/app/app/addons/row-data'

/** The add-on list and the bill. The bill follows the switches as they latch. */
export function AddonsPanel({ rows, baseCents, readOnly }: { rows: AddonRowData[]; baseCents: number; readOnly: boolean }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(rows.map((row) => [row.key, row.enabled])))

  return (
    <>
      {rows.length === 0 ? (
        <p className="mt-6 max-w-xl text-[15px]">{EMPTY_STATE}</p>
      ) : (
        BANDS.filter(({ band }) => rows.some((row) => row.band === band)).map(({ band, heading, note }) => (
          <section key={band} className="mt-8">
            <h2 className="text-[18px] font-semibold">{heading}</h2>
            {note ? <p className="mt-2 max-w-xl text-[15px] text-foreground/80">{note}</p> : null}
            <ul className="mt-2">
              {rows
                .filter((row) => row.band === band)
                .map((row) => (
                  <AddonRow
                    key={row.key}
                    enabled={enabled[row.key] === true}
                    onChange={(next) => setEnabled((current) => ({ ...current, [row.key]: next }))}
                    readOnly={readOnly}
                    row={row}
                  />
                ))}
            </ul>
          </section>
        ))
      )}
      <BillBar baseCents={baseCents} enabled={enabled} rows={rows} />
    </>
  )
}
