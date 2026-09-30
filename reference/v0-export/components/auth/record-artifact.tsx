import { ParcelMap } from '@/components/parcel-map'
import type { Lot } from '@/lib/types'

const LOTS: Lot[] = [
  { id: 'a', col: 0, row: 0, kind: 'plain' },
  { id: 'b', col: 1, row: 0, kind: 'sold', price: 812000 },
  { id: 'c', col: 2, row: 0, kind: 'plain' },
  { id: 'd', col: 0, row: 1, kind: 'plain' },
  { id: 'e', col: 1, row: 1, kind: 'client' },
  { id: 'f', col: 2, row: 1, kind: 'sold', price: 749000 },
]

/**
 * A tactile "county record card" used as the hero artifact on the auth
 * showcase panel: an official ledger header, the parcel map, and a few
 * record fields — the product's core object, made physical.
 */
export function RecordArtifact() {
  return (
    <div className="w-full max-w-[340px] -rotate-1">
      <div className="rounded-2xl bg-white p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              County Recorder
            </p>
            <p className="mt-0.5 text-[14px] font-[660] tracking-[-0.01em] text-ink">
              1142 Oakdale Ave
            </p>
          </div>
          <span className="rounded-full bg-blue-soft px-2.5 py-1 text-[10px] font-[620] uppercase tracking-[0.08em] text-blue">
            On record
          </span>
        </div>

        <div className="py-4">
          <ParcelMap
            lots={LOTS}
            streetName="Oakdale Ave"
            ariaLabel="Parcel map showing the homeowner's lot with two recently recorded neighbor sales"
          />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line pt-3">
          {[
            ['Grant deed', '2019-0447120'],
            ['Owner of record', 'Okafor, M.'],
            ['Assessed', '$184,200'],
            ['Est. market', '$792,000'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                {k}
              </dt>
              <dd className="mt-0.5 text-[13px] font-[560] text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
