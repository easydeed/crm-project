import type { PriorCall, SignalContact, SignalEvent, SignalInput, SignalKind, StreetSale } from '@/signals/types'

export const AS_OF = new Date('2026-06-15T12:00:00.000Z')

type Expectation = { contactId: string; kind: SignalKind }

export type SignalScenario = {
  name: string
  input: SignalInput
  expect: Expectation[]
}

function contact(args: {
  id: string
  address: string
  street?: string
  closeDate?: string | null
  assessedValue?: number | null
  subscribed?: boolean
  status?: SignalContact['status']
  events?: SignalEvent[]
}): SignalContact {
  const street = args.street ?? 'oakdale'
  return {
    id: args.id,
    name: args.id,
    status: args.status ?? 'matched',
    subscribed: args.subscribed ?? true,
    closeDate: args.closeDate === undefined ? '2016-06-15' : args.closeDate,
    parcel: {
      id: `parcel-${args.id}`,
      address: args.address,
      zip: '91750',
      streetNameNorm: street,
      useCode: 'SFR',
      assessedValue: args.assessedValue === undefined ? null : args.assessedValue,
    },
    events: args.events ?? [],
  }
}

function sale(args: {
  id: string
  address: string
  recordedAt: string
  amount: number
  street?: string
}): StreetSale {
  return {
    parcelId: `sale-${args.id}`,
    address: args.address,
    zip: '91750',
    streetNameNorm: args.street ?? 'oakdale',
    useCode: 'SFR',
    recordedAt: args.recordedAt,
    amount: args.amount,
    docNumber: `doc-${args.id}`,
  }
}

function input(
  contacts: SignalContact[],
  streetSales: StreetSale[],
  priorCalls: PriorCall[] = [],
): SignalInput {
  return { asOf: AS_OF, contacts, streetSales, priorCalls }
}

const taxSales = [
  sale({ id: 'tax-a', address: '1800 Oakdale Ave', recordedAt: '2025-08-01', amount: 1_000_000 }),
  sale({ id: 'tax-b', address: '1900 Oakdale Ave', recordedAt: '2025-09-01', amount: 1_080_000 }),
]

const reconveyance: SignalEvent = {
  kind: 'reconveyance',
  docNumber: 'rel-1',
  recordedAt: '2026-06-01',
  amount: null,
}

export const scenarios: SignalScenario[] = [
  {
    name: 'a strong nearby sale',
    input: input(
      [contact({ id: 'near', address: '1200 Oakdale Ave' })],
      [
        sale({ id: 'near', address: '1204 Oakdale Ave', recordedAt: '2026-06-05', amount: 980_000 }),
        sale({ id: 'near-higher', address: '1800 Oakdale Ave', recordedAt: '2025-08-01', amount: 1_200_000 }),
      ],
    ),
    expect: [{ contactId: 'near', kind: 'sold_nearby' }],
  },
  {
    name: 'a record-setting sale',
    input: input(
      [contact({ id: 'record', address: '1200 Oakdale Ave' })],
      [
        sale({ id: 'record', address: '1204 Oakdale Ave', recordedAt: '2026-06-05', amount: 1_120_000 }),
        sale({ id: 'record-older', address: '1800 Oakdale Ave', recordedAt: '2025-08-01', amount: 900_000 }),
      ],
    ),
    expect: [{ contactId: 'record', kind: 'sold_nearby' }],
  },
  {
    name: 'a reconveyance',
    input: input(
      [contact({ id: 'loan', address: '500 Maple Ave', street: 'maple', events: [reconveyance] })],
      [],
    ),
    expect: [{ contactId: 'loan', kind: 'loan_paid_off' }],
  },
  {
    name: 'a large tax gap with long tenure',
    input: input(
      [contact({ id: 'tax', address: '1100 Oakdale Ave', closeDate: '2014-06-15', assessedValue: 817_800 })],
      taxSales,
    ),
    expect: [{ contactId: 'tax', kind: 'tax_upside' }],
  },
  {
    name: 'a large gap with short tenure',
    input: input(
      [contact({ id: 'short', address: '1100 Oakdale Ave', closeDate: '2025-06-15', assessedValue: 817_800 })],
      taxSales,
      [{ contactId: 'short', period: '2026-04' }],
    ),
    expect: [],
  },
  {
    name: 'a contact with two signals',
    input: input(
      [
        contact({
          id: 'both',
          address: '1200 Oakdale Ave',
          events: [{ ...reconveyance, docNumber: 'rel-both' }],
        }),
      ],
      [
        sale({ id: 'both', address: '1204 Oakdale Ave', recordedAt: '2026-06-05', amount: 1_120_000 }),
        sale({ id: 'both-older', address: '1800 Oakdale Ave', recordedAt: '2025-08-01', amount: 900_000 }),
      ],
    ),
    expect: [{ contactId: 'both', kind: 'sold_nearby' }],
  },
  {
    name: 'an account with only one qualifying contact',
    input: input(
      [
        contact({ id: 'only', address: '500 Maple Ave', street: 'maple', events: [reconveyance] }),
        contact({ id: 'unmatched', address: '12 Oakdale Ave', status: 'needs_review', subscribed: false }),
      ],
      [],
    ),
    expect: [{ contactId: 'only', kind: 'loan_paid_off' }],
  },
  {
    name: 'an account with none',
    input: input(
      [contact({ id: 'none', address: '1000 Oakdale Ave', subscribed: false })],
      [sale({ id: 'none', address: '1040 Oakdale Ave', recordedAt: '2026-06-05', amount: 900_000 })],
    ),
    expect: [],
  },
  {
    name: 'a contact chosen last month with a new sale',
    input: input(
      [contact({ id: 'again', address: '1200 Oakdale Ave' })],
      [
        sale({ id: 'again', address: '1204 Oakdale Ave', recordedAt: '2026-06-05', amount: 980_000 }),
        sale({ id: 'again-higher', address: '1800 Oakdale Ave', recordedAt: '2025-08-01', amount: 1_200_000 }),
      ],
      [{ contactId: 'again', period: '2026-05' }],
    ),
    expect: [{ contactId: 'again', kind: 'sold_nearby' }],
  },
  {
    name: 'a contact chosen last month with a new payoff',
    input: input(
      [contact({ id: 'payoff', address: '500 Maple Ave', street: 'maple', events: [reconveyance] })],
      [],
      [{ contactId: 'payoff', period: '2026-05' }],
    ),
    expect: [{ contactId: 'payoff', kind: 'loan_paid_off' }],
  },
  {
    name: 'a contact chosen last month with only a stale tax signal',
    input: input(
      [contact({ id: 'stale', address: '1100 Oakdale Ave', closeDate: '2014-06-15', assessedValue: 817_800 })],
      taxSales,
      [{ contactId: 'stale', period: '2026-05' }],
    ),
    expect: [],
  },
  {
    name: 'quiet when nothing else is going on',
    input: input([contact({ id: 'quiet', address: '500 Maple Ave', street: 'maple' })], []),
    expect: [{ contactId: 'quiet', kind: 'quiet_a_while' }],
  },
  {
    name: 'exactly three when more qualify',
    input: input(
      [
        contact({ id: 'rank-a', address: '1000 Oakdale Ave' }),
        contact({ id: 'rank-b', address: '2000 Oakdale Ave' }),
        contact({ id: 'rank-c', address: '3000 Oakdale Ave' }),
        contact({ id: 'rank-d', address: '4000 Oakdale Ave' }),
      ],
      [
        sale({ id: 'rank-a', address: '1004 Oakdale Ave', recordedAt: '2026-06-05', amount: 1_100_000 }),
        sale({ id: 'rank-b', address: '2004 Oakdale Ave', recordedAt: '2026-06-03', amount: 1_100_000 }),
        sale({ id: 'rank-c', address: '3004 Oakdale Ave', recordedAt: '2026-06-01', amount: 1_100_000 }),
        sale({ id: 'rank-d', address: '4010 Oakdale Ave', recordedAt: '2026-05-06', amount: 1_100_000 }),
        sale({ id: 'rank-high', address: '9000 Oakdale Ave', recordedAt: '2025-08-01', amount: 2_000_000 }),
      ],
    ),
    expect: [
      { contactId: 'rank-a', kind: 'sold_nearby' },
      { contactId: 'rank-b', kind: 'sold_nearby' },
      { contactId: 'rank-c', kind: 'sold_nearby' },
    ],
  },
  {
    name: 'variety when a different kind is close',
    input: input(
      [
        contact({ id: 'close-a', address: '1000 Oakdale Ave' }),
        contact({ id: 'close-b', address: '2000 Oakdale Ave' }),
        contact({ id: 'close-c', address: '3000 Oakdale Ave' }),
        contact({
          id: 'close-loan',
          address: '500 Maple Ave',
          street: 'maple',
          events: [{ ...reconveyance, docNumber: 'rel-close', recordedAt: '2026-06-10' }],
        }),
      ],
      [
        sale({ id: 'close-a', address: '1008 Oakdale Ave', recordedAt: '2026-05-26', amount: 900_000 }),
        sale({ id: 'close-b', address: '2008 Oakdale Ave', recordedAt: '2026-05-24', amount: 900_000 }),
        sale({ id: 'close-c', address: '3010 Oakdale Ave', recordedAt: '2026-05-28', amount: 900_000 }),
        sale({ id: 'close-high', address: '9000 Oakdale Ave', recordedAt: '2025-08-01', amount: 2_000_000 }),
      ],
    ),
    expect: [
      { contactId: 'close-a', kind: 'sold_nearby' },
      { contactId: 'close-loan', kind: 'loan_paid_off' },
      { contactId: 'close-b', kind: 'sold_nearby' },
    ],
  },
  {
    name: 'a third of the same kind gives way when anyone else qualifies',
    input: input(
      [
        contact({ id: 'mix-a', address: '1000 Oakdale Ave' }),
        contact({ id: 'mix-b', address: '2000 Oakdale Ave' }),
        contact({ id: 'mix-c', address: '3000 Oakdale Ave' }),
        contact({ id: 'mix-quiet', address: '500 Maple Ave', street: 'maple' }),
      ],
      [
        sale({ id: 'mix-a', address: '1004 Oakdale Ave', recordedAt: '2026-06-05', amount: 1_100_000 }),
        sale({ id: 'mix-b', address: '2004 Oakdale Ave', recordedAt: '2026-06-03', amount: 1_100_000 }),
        sale({ id: 'mix-c', address: '3004 Oakdale Ave', recordedAt: '2026-06-01', amount: 1_100_000 }),
      ],
    ),
    expect: [
      { contactId: 'mix-a', kind: 'sold_nearby' },
      { contactId: 'mix-b', kind: 'sold_nearby' },
      { contactId: 'mix-quiet', kind: 'quiet_a_while' },
    ],
  },
]
