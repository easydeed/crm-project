import type { Lot } from '@/lib/types'
import { ParcelMap } from '@/components/parcel-map'
import { MlsAttribution } from '@/components/lab/mls-attribution'

/* The email speaks in a document voice, deliberately off the site palette:
   warm paper, a serif body, hairline rules, and an oxblood recorder stamp. */
const PAPER = '#FDFCFA'
const HAIR = '#E2E5E4'
const INK = '#20293B'
const MUTE = '#6E7683'
const OX = '#8A2B3E'
const OX_SOFT = '#B0707C'
const GREEN = '#2F5D50'
const SAGE = '#8AA398'
const SERIF = 'Georgia, "Iowan Old Style", "Palatino Linotype", serif'

const LOTS: Lot[] = [
  { id: 'a', col: 0, row: 0, kind: 'plain' },
  { id: 'b', col: 1, row: 0, kind: 'client' },
  { id: 'c', col: 2, row: 0, kind: 'sold', price: 1065000 },
  { id: 'd', col: 3, row: 0, kind: 'plain' },
  { id: 'e', col: 0, row: 1, kind: 'sold', price: 1120000 },
  { id: 'f', col: 1, row: 1, kind: 'plain' },
  { id: 'g', col: 2, row: 1, kind: 'plain' },
  { id: 'h', col: 3, row: 1, kind: 'sold', price: 985000 },
]

const STAMP: Array<[string, string]> = [
  ['Grant deed', 'Recorded Mar 14, 2019'],
  ['Document', '2019-0248117'],
  ['Recorded price', '$712,000'],
  ['Vesting', 'Joint tenants'],
]

const COMPARE: Array<{ a: string; label: string; b: string; diff: boolean }> = [
  { a: '3', label: 'Bedrooms', b: '3', diff: false },
  { a: '2', label: 'Bathrooms', b: '3', diff: true },
  { a: '1,610 sq ft', label: 'Living area', b: '1,750 sq ft', diff: true },
]

const SALES: Array<{ address: string; doc: string; rec: string; price: string; dist: string }> = [
  { address: '1108 Oakdale Ave', doc: '2026-0742318', rec: 'May 1', price: '$1,120,000', dist: 'two doors down' },
  { address: '1187 Oakdale Ave', doc: '2026-1188402', rec: 'Jul 22', price: '$1,065,000', dist: 'four doors down' },
  { address: '2334 Bonita Ave', doc: '2026-0994117', rec: 'Jun 9', price: '$985,000', dist: 'around the corner' },
]

const LOAN: Array<[string, string]> = [
  ['Deed of trust', '$569,600 \u00b7 recorded Mar 14, 2019'],
  ['Lender of record', 'Cardinal Home Loans'],
  ['Reconveyance', 'None recorded'],
]

function Hair() {
  return <div aria-hidden className="my-6" style={{ borderTop: `1px solid ${HAIR}` }} />
}

function Caption({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-sans${className ? ` ${className}` : ''}`} style={{ fontSize: 11, lineHeight: 1.6, color: MUTE }}>
      {children}
    </p>
  )
}

export function SampleEmail({
  variant = 'page',
  phone = false,
  animate = false,
}: {
  variant?: 'modal' | 'page'
  phone?: boolean
  animate?: boolean
}) {
  return (
    <div className="mx-auto" style={{ width: phone ? 380 : 600, maxWidth: '100%' }}>
      <div
        className="overflow-hidden rounded-sm border"
        style={{ backgroundColor: PAPER, color: INK, fontFamily: SERIF, borderColor: HAIR, padding: 30 }}
      >
        {/* 1 — sender */}
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-full font-sans text-[13px] font-[600] text-white"
            style={{ backgroundColor: SAGE }}
          >
            DW
          </div>
          <div>
            <p style={{ fontSize: 16 }}>Dana Whitfield</p>
            <p className="font-sans" style={{ fontSize: 12, color: MUTE }}>
              Coastline Realty {'\u00b7'} DRE 01998432 {'\u00b7'} (909) 555-0148
            </p>
          </div>
        </div>

        <Hair />

        {/* 2 — headline + greeting */}
        <h2 className="text-pretty font-[600] tracking-[-0.01em]" style={{ fontSize: phone ? 22 : 25, lineHeight: 1.24 }}>
          Three homes on Oakdale changed hands this year. Here&apos;s where yours stands.
        </h2>
        <p className="mt-3" style={{ fontSize: 16.5, lineHeight: 1.62 }}>
          Morning, Marilyn. Everything below comes from documents recorded with the Los Angeles County
          Recorder {'\u2014'} the actual record, not an online estimate.
        </p>

        <Hair />

        {/* 3 — recording stamp */}
        <div
          className="font-sans"
          style={{ border: `2px solid ${OX}`, maxWidth: 340, padding: '14px 16px', transform: 'rotate(-1.1deg)' }}
        >
          <p className="font-[700]" style={{ fontSize: 15, color: OX, fontFamily: SERIF }}>
            1142 Oakdale Ave
          </p>
          <p style={{ fontSize: 12, color: OX_SOFT }}>La Verne, CA 91750</p>
          <div className="mt-3 space-y-1.5">
            {STAMP.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4" style={{ fontSize: 12 }}>
                <span style={{ color: OX_SOFT }}>{k}</span>
                <span className="tabular-nums" style={{ color: OX }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 italic" style={{ fontSize: 16.5, lineHeight: 1.6 }}>
          You&apos;ve owned it seven years and five months.
        </p>

        <Hair />

        {/* 4 — parcel map */}
        <ParcelMap lots={LOTS} streetName="Oakdale Ave" animated={animate} />
        <Caption className="mt-2">
          Oakdale Ave, La Verne {'\u00b7'} 41 parcels {'\u00b7'} 3 recorded transfers in the last 12 months
        </Caption>

        <Hair />

        {/* 5 — four doors down */}
        <h3 className="font-[600]" style={{ fontSize: 19, lineHeight: 1.3 }}>
          1187 Oakdale Ave is for sale {'\u2014'} four doors down
        </h3>
        <p className="mt-1" style={{ fontSize: 16.5 }}>
          <span className="font-[700] tabular-nums">$1,065,000</span> {'\u00b7'} Listed August 12
        </p>

        <div className="mt-3" style={{ border: `1px solid ${HAIR}` }}>
          <div className="grid grid-cols-2 font-sans">
            <div className="p-3" style={{ borderRight: `1px solid ${HAIR}` }}>
              <p className="font-[600]" style={{ fontSize: 13 }}>
                1187 Oakdale
              </p>
              <p style={{ fontSize: 11, color: MUTE }}>listed on the MLS</p>
            </div>
            <div className="p-3">
              <p className="font-[600]" style={{ fontSize: 13 }}>
                Yours
              </p>
              <p style={{ fontSize: 11, color: MUTE }}>from the county assessor</p>
            </div>
          </div>
          {COMPARE.map((r) => (
            <div
              key={r.label}
              className="grid grid-cols-3 items-center px-3 py-2.5 font-sans"
              style={{ fontSize: 13, borderTop: `1px solid ${HAIR}` }}
            >
              <span
                className="text-left tabular-nums"
                style={{ fontWeight: r.diff ? 700 : 400, color: r.diff ? INK : MUTE }}
              >
                {r.a}
              </span>
              <span className="text-center" style={{ fontSize: 11, color: MUTE }}>
                {r.label}
              </span>
              <span
                className="text-right tabular-nums"
                style={{ fontWeight: r.diff ? 700 : 400, color: r.diff ? INK : MUTE }}
              >
                {r.b}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3 italic" style={{ fontSize: 16.5, lineHeight: 1.6 }}>
          It&apos;s 140 square feet smaller than yours, with one fewer bathroom.
        </p>

        <div className="mt-3 space-y-1">
          <Caption>Listing courtesy of Sunwest Properties.</Caption>
          <MlsAttribution />
          <Caption>Listing data as of Aug 29, 2026.</Caption>
        </div>

        <Hair />

        {/* 6 — Prop 13 */}
        <h3 className="font-[600]" style={{ fontSize: 19, lineHeight: 1.3 }}>
          Your property tax basis is worth about $2,600 a year
        </h3>
        <div className={phone ? 'mt-4 flex flex-col gap-3' : 'mt-4 grid grid-cols-2'}>
          <div className={phone ? '' : 'pr-5'}>
            <p className="font-sans" style={{ fontSize: 12, color: MUTE }}>
              What the county taxes you on
            </p>
            <p className="mt-1 font-[700] tabular-nums" style={{ fontSize: 28, lineHeight: 1.1 }}>
              $817,800
            </p>
          </div>
          <div
            className={phone ? 'pt-3' : 'pl-5'}
            style={phone ? { borderTop: `1px solid ${HAIR}` } : { borderLeft: `1px solid ${HAIR}` }}
          >
            <p className="font-sans" style={{ fontSize: 12, color: MUTE }}>
              What a buyer would be taxed on today
            </p>
            <p className="mt-1 font-[700] tabular-nums" style={{ fontSize: 28, lineHeight: 1.1, color: OX }}>
              $1,040,000
            </p>
          </div>
        </div>
        <p className="mt-4" style={{ fontSize: 16.5, lineHeight: 1.62 }}>
          Under Proposition 13, your assessed value has climbed only 2% a year since 2019. Anyone buying your
          house today is reassessed at the sale price and pays roughly $2,600 more a year in property taxes than
          you do.
        </p>
        <p className="mt-4 pl-4" style={{ fontSize: 16.5, lineHeight: 1.6, color: GREEN, borderLeft: `3px solid ${GREEN}` }}>
          That basis doesn&apos;t transfer to a buyer {'\u2014'} but if you move somewhere else in California,
          Proposition 19 may let you take it with you.
        </p>
        <Caption className="mt-3">
          Estimated using LA County&apos;s 2026{'\u2013'}27 rate for your tax area, including direct assessments.
          Prop 19 has age and timing rules worth confirming before you count on it.
        </Caption>

        <Hair />

        {/* 7 — recorded sales */}
        <h3 className="font-[600]" style={{ fontSize: 19, lineHeight: 1.3 }}>
          What actually sold on your street
        </h3>
        <div className="mt-3">
          {SALES.map((s, i) => (
            <div
              key={s.doc}
              className="flex items-baseline justify-between gap-4 py-3"
              style={i ? { borderTop: `1px solid ${HAIR}` } : undefined}
            >
              <div>
                <p style={{ fontSize: 16.5 }}>{s.address}</p>
                <p className="font-sans" style={{ fontSize: 11, color: MUTE }}>
                  Doc {s.doc} {'\u00b7'} recorded {s.rec}
                </p>
              </div>
              <div className="text-right">
                <p className="font-[700] tabular-nums" style={{ fontSize: 16.5 }}>
                  {s.price}
                </p>
                <p className="font-sans" style={{ fontSize: 11, color: MUTE }}>
                  {s.dist}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Caption className="mt-2">These are recorded sale prices, not listing prices or estimates.</Caption>

        <Hair />

        {/* 8 — the loan on record */}
        <h3 className="font-[600]" style={{ fontSize: 19, lineHeight: 1.3 }}>
          Your loan, as the record shows it
        </h3>
        <dl className="mt-3">
          {LOAN.map(([k, v], i) => (
            <div
              key={k}
              className="flex items-baseline justify-between gap-4 py-2.5"
              style={i ? { borderTop: `1px solid ${HAIR}` } : undefined}
            >
              <dt className="font-sans" style={{ fontSize: 12, color: MUTE }}>
                {k}
              </dt>
              <dd className="text-right font-sans tabular-nums" style={{ fontSize: 13 }}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 italic" style={{ fontSize: 16.5, lineHeight: 1.6 }}>
          Nothing has been recorded against the property since, so as far as the county knows this is still your
          only loan. If you&apos;ve refinanced somewhere it hasn&apos;t posted yet, tell me and I&apos;ll correct
          it.
        </p>

        {/* 9 — the single CTA, on a white band */}
        <div
          className="mt-6 text-center"
          style={{
            marginLeft: -30,
            marginRight: -30,
            padding: '24px 30px',
            backgroundColor: '#FFFFFF',
            borderTop: `1px solid ${HAIR}`,
            borderBottom: `1px solid ${HAIR}`,
          }}
        >
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-lg bg-blue px-6 font-sans font-[620] text-white"
            style={{ height: 48, fontSize: 15 }}
          >
            Ask Dana about your Prop 19 options
          </a>
          <p className="mt-3 font-sans" style={{ fontSize: 12, color: MUTE }}>
            Or just reply to this email {'\u2014'} it reaches her directly.
          </p>
        </div>

        {/* 10 — footer */}
        <div className="mt-6 font-sans" style={{ fontSize: 11, lineHeight: 1.7, color: MUTE }}>
          <p className="font-[600]" style={{ color: INK }}>
            Dana Whitfield {'\u00b7'} Coastline Realty
          </p>
          <p>214 D St, La Verne, CA 91750</p>
          <p className="mt-2">
            Property information sourced from documents recorded with the Los Angeles County Recorder and the LA
            County Assessor roll. Figures marked as estimates are estimates.
          </p>
          <p className="mt-2">
            <a className="underline underline-offset-2" href="#">
              Update your address
            </a>
            <span className="px-2">{'\u00b7'}</span>
            <a className="underline underline-offset-2" href="#">
              Stop these emails
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
