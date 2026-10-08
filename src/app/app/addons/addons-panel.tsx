'use client'

import { useState } from 'react'
import { AddonRow } from '@/app/app/addons/addon-row'
import { BillBar } from '@/app/app/addons/bill-bar'
import { BANDS, EMPTY_STATE, type AddonRowData } from '@/app/app/addons/row-data'
import { mutedClass, panelBodyClass, panelClass, panelHeaderClass } from '@/app/app/people/ui'

/** The add-on list and the bill. The bill follows the switches as they latch. */
export function AddonsPanel({ rows, baseCents, readOnly }: { rows: AddonRowData[]; baseCents: number; readOnly: boolean }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(rows.map((row) => [row.key, row.enabled])))

  return (
    <>
      {rows.length === 0 ? (
        <p className={`mt-5 max-w-xl text-[17px] ${panelClass} ${panelBodyClass}`}>{EMPTY_STATE}</p>
      ) : (
        BANDS.filter(({ band }) => rows.some((row) => row.band === band)).map(({ band, heading, note }) => (
          <section key={band} className={`mt-5 sm:mt-6 ${panelClass}`}>
            <h2 className={panelHeaderClass}>{heading}</h2>
            {note ? <p className={`max-w-xl border-b border-rule px-5 py-3.5 sm:px-6 ${mutedClass}`}>{note}</p> : null}
            <ul className="divide-y divide-rule">
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
