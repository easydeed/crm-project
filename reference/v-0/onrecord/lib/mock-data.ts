import type {
  Addon,
  CallSignal,
  Contact,
  ContactStatus,
  Engagement,
  PropertyRecord,
} from './types'

const CITIES = ['La Verne', 'Claremont', 'San Dimas', 'Glendora', 'Pomona']

const STREETS = [
  'Oakdale Ave',
  'Damien Ave',
  'Bonita Ave',
  'Baseline Rd',
  'Foothill Blvd',
  'Arrow Hwy',
  'White Ave',
  'Wheeler Ave',
  'Badillo St',
  'Grand Ave',
  'Towne Ave',
  'Puddingstone Dr',
]

const FIRST = [
  'James', 'Linda', 'Robert', 'Patricia', 'Michael', 'Barbara', 'David',
  'Susan', 'Richard', 'Jessica', 'Thomas', 'Karen', 'Charles', 'Nancy',
  'Daniel', 'Betty', 'Paul', 'Sandra', 'Mark', 'Carol', 'Donald', 'Ruth',
  'George', 'Sharon', 'Kenneth', 'Michelle', 'Steven', 'Laura', 'Edward',
  'Cynthia', 'Brian', 'Kathleen', 'Ronald', 'Amy', 'Anthony', 'Angela',
  'Kevin', 'Shirley', 'Jason', 'Anna', 'Gary',
]

const LAST = [
  'Nguyen', 'Ramirez', 'Torres', 'Fletcher', 'Okonkwo', 'Delgado', 'Hoffman',
  'Castellano', 'Whitfield', 'Alvarez', 'Bhatt', 'Sorensen', 'Ibrahim',
  'Kaminski', 'Marchetti', 'Osei', 'Petrov', 'Quintero', 'Reyes', 'Underwood',
  'Vargas', 'Weaver', 'Xiong', 'Yamada', 'Zhang', 'Abernathy', 'Beaumont',
  'Cho', 'Dunbar', 'Escobar', 'Farrell', 'Gallardo', 'Hassan', 'Ivanov',
  'Jefferson', 'Kowalski', 'Lombardi', 'Mahoney', 'Novak', 'Ortega', 'Park',
]

const LENDERS = [
  'Cardinal Home Loans',
  'Pacific Crest Mortgage',
  'Summit Federal Credit Union',
  'Meridian Bank, N.A.',
  'Golden State Lending',
]

const VESTINGS = [
  'Husband and wife as joint tenants',
  'A married couple as community property with right of survivorship',
  'An unmarried person',
  'A married man as his sole and separate property',
  'Trustees of the family living trust',
]

/** deterministic pseudo-random so data is stable across renders */
function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function makeRecord(rand: () => number, price: number): PropertyRecord {
  const year = 2013 + Math.floor(rand() * 11)
  const month = String(1 + Math.floor(rand() * 12)).padStart(2, '0')
  const day = String(1 + Math.floor(rand() * 27)).padStart(2, '0')
  const loan = Math.round((price * (0.7 + rand() * 0.15)) / 100) * 100
  const assessed = Math.round(price * (0.78 + rand() * 0.08))
  const median = Math.round(price * (0.94 + rand() * 0.14))
  const docNum = `${year}-0${String(100000 + Math.floor(rand() * 899999))}`
  return {
    deedRecorded: `${year}-${month}-${day}`,
    docNumber: docNum,
    recordedPrice: price,
    vesting: VESTINGS[Math.floor(rand() * VESTINGS.length)],
    loanAmount: loan,
    loanRecorded: `${year}-${month}-${day}`,
    lender: LENDERS[Math.floor(rand() * LENDERS.length)],
    reconveyed: rand() > 0.7,
    assessedValue: assessed,
    streetMedian: median,
  }
}

// Hand-authored contacts that the product references by name.
const FEATURED: Contact[] = [
  {
    id: 'c-okafor',
    name: 'Marilyn Okafor',
    email: 'marilyn.okafor@gmail.com',
    phone: '(909) 555-0142',
    address: '1142 Oakdale Ave',
    city: 'La Verne',
    closedDate: '2019-03-14',
    status: 'matched',
    engagement: 'opened_recently',
    groups: ['My Sphere'],
    notes: 'Referred the Delgados. Asked about Prop 19 at the open house.',
    record: {
      deedRecorded: '2019-03-14',
      docNumber: '2019-0248117',
      recordedPrice: 712000,
      vesting: 'A married couple as community property with right of survivorship',
      loanAmount: 569600,
      loanRecorded: '2019-03-14',
      lender: 'Cardinal Home Loans',
      reconveyed: false,
      assessedValue: 817800,
      streetMedian: 968000,
    },
  },
  {
    id: 'c-villanueva',
    name: 'Ray & Teresa Villanueva',
    email: 'rvillanueva@outlook.com',
    phone: '(626) 555-0188',
    address: '830 Damien Ave',
    city: 'La Verne',
    closedDate: '2021-08-06',
    status: 'matched',
    engagement: 'quiet',
    groups: ['My Sphere'],
    notes: '',
    record: {
      deedRecorded: '2021-08-06',
      docNumber: '2021-1180422',
      recordedPrice: 905000,
      vesting: 'Husband and wife as joint tenants',
      loanAmount: 724000,
      loanRecorded: '2021-08-06',
      lender: 'Pacific Crest Mortgage',
      reconveyed: false,
      assessedValue: 941000,
      streetMedian: 1010000,
    },
  },
  {
    id: 'c-sato',
    name: 'Glenn Sato',
    email: 'glenn.sato@icloud.com',
    phone: '(909) 555-0119',
    address: '2201 Bonita Ave',
    city: 'San Dimas',
    closedDate: '2017-06-22',
    status: 'matched',
    engagement: 'quiet',
    groups: ['My Sphere'],
    notes: 'Retired teacher. Prefers a phone call to email.',
    record: {
      deedRecorded: '2017-06-22',
      docNumber: '2017-0701934',
      recordedPrice: 638000,
      vesting: 'An unmarried person',
      loanAmount: 486000,
      loanRecorded: '2017-06-22',
      lender: 'Summit Federal Credit Union',
      reconveyed: true,
      assessedValue: 701000,
      streetMedian: 815000,
    },
  },
  {
    id: 'c-abernathy',
    name: 'Carol Abernathy',
    email: 'carol.abernathy@gmail.com',
    phone: '(909) 555-0203',
    address: '145 Wheeler Ave',
    city: 'La Verne',
    closedDate: '2016-05-11',
    status: 'matched',
    engagement: 'moved',
    groups: ['My Sphere'],
    notes: 'Home transferred in June — not through us. Confirm forwarding address.',
    record: {
      deedRecorded: '2016-05-11',
      docNumber: '2016-0556201',
      recordedPrice: 599000,
      vesting: 'A married man as his sole and separate property',
      loanAmount: 459000,
      loanRecorded: '2016-05-11',
      lender: 'Meridian Bank, N.A.',
      reconveyed: true,
      assessedValue: 662000,
      streetMedian: 744000,
    },
  },
]

// Contacts that need attention on the match screen.
const REVIEW: Contact[] = [
  {
    id: 'c-review-1',
    name: 'Dennis Kaminski',
    email: 'dkaminski@gmail.com',
    phone: '(626) 555-0311',
    address: '412 N Grand Ave',
    city: 'Glendora',
    closedDate: '2020-09-30',
    status: 'needs_review',
    engagement: 'never_opened',
    groups: ['My Sphere'],
    notes: '',
  },
  {
    id: 'c-review-2',
    name: 'Priya Bhatt',
    email: 'priya.bhatt@gmail.com',
    phone: '(909) 555-0347',
    address: '77 Foothill Blvd Apt 4',
    city: 'Claremont',
    closedDate: '2022-02-18',
    status: 'needs_review',
    engagement: 'never_opened',
    groups: ['My Sphere'],
    notes: 'Unit number may be off — verify parcel.',
  },
  {
    id: 'c-review-3',
    name: 'Walter & Ada Sorensen',
    email: 'wsorensen@outlook.com',
    phone: '(626) 555-0362',
    address: '2984 Baseline Rd',
    city: 'Claremont',
    closedDate: '2018-11-02',
    status: 'needs_review',
    engagement: 'quiet',
    groups: ['My Sphere'],
    notes: '',
  },
  {
    id: 'c-noparcel',
    name: 'Hank Delgado',
    email: 'hank.delgado@gmail.com',
    phone: '(909) 555-0390',
    address: 'PO Box 1183',
    city: 'Pomona',
    closedDate: '2015-07-24',
    status: 'no_parcel',
    engagement: 'never_opened',
    groups: ['My Sphere'],
    notes: 'Gave a PO box at closing — need a street address to match a parcel.',
  },
  {
    id: 'c-noparcel-2',
    name: 'Estelle Brooks',
    email: 'estelle.brooks@yahoo.com',
    phone: '(626) 555-0418',
    address: 'PO Box 664',
    city: 'San Dimas',
    closedDate: '2016-03-11',
    status: 'no_parcel',
    engagement: 'quiet',
    groups: ['My Sphere'],
    notes: 'Only ever gave a PO box — ask for the street address to pull her parcel.',
  },
]

function generateRest(count: number): Contact[] {
  const out: Contact[] = []
  for (let i = 0; i < count; i++) {
    const rand = seeded(i * 7919 + 13)
    const first = FIRST[i % FIRST.length]
    const last = LAST[(i * 3) % LAST.length]
    const name = `${first} ${last}`
    const city = CITIES[i % CITIES.length]
    const street = STREETS[(i * 5) % STREETS.length]
    const num = 100 + Math.floor(rand() * 3800)
    const price = 580000 + Math.floor(rand() * 720000)
    const closedYear = 2014 + Math.floor(rand() * 11)
    const closedMonth = String(1 + Math.floor(rand() * 12)).padStart(2, '0')
    const closedDay = String(1 + Math.floor(rand() * 27)).padStart(2, '0')
    const engRoll = rand()
    const engagement: Engagement =
      engRoll > 0.72
        ? 'opened_recently'
        : engRoll > 0.38
          ? 'quiet'
          : 'never_opened'
    out.push({
      id: `c-gen-${i}`,
      name,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${['gmail.com', 'outlook.com', 'icloud.com', 'yahoo.com'][i % 4]}`,
      phone: `(${[909, 626, 818][i % 3]}) 555-0${String(400 + i).padStart(3, '0')}`,
      address: `${num} ${street}`,
      city,
      closedDate: `${closedYear}-${closedMonth}-${closedDay}`,
      status: 'matched' as ContactStatus,
      engagement,
      groups: ['My Sphere'],
      notes: '',
      record: makeRecord(rand, price),
    })
  }
  return out
}

export const SEED_CONTACTS: Contact[] = [
  ...FEATURED,
  ...REVIEW,
  ...generateRest(47 - FEATURED.length - REVIEW.length),
]

export const CALL_SIGNALS: CallSignal[] = [
  {
    contactId: 'c-okafor',
    kind: 'reading_closely',
    detail:
      'Opened the last three emails and clicked the Prop 19 section twice in August.',
  },
  {
    contactId: 'c-villanueva',
    kind: 'new_deed_nearby',
    detail:
      'A deed recorded two doors down at $1,120,000 \u2014 highest on their street so far.',
  },
  {
    contactId: 'c-sato',
    kind: 'loan_reconveyed',
    detail:
      'A full reconveyance was recorded last week; he either paid it off or refinanced.',
  },
]

export const SEED_GROUPS = ['My Sphere', 'Past buyers', 'Sellers 2024']

export const SEED_ADDONS: Addon[] = [
  {
    id: 'text-call-list',
    title: 'Text me the call list',
    detail:
      'A text on the 1st with the three names, so you don\u2019t have to open anything.',
    price: '$2',
    priceValue: 2,
    unit: '/mo',
    tier: 'extra',
    enabled: true,
  },
  {
    id: 'weekly-note',
    title: 'Weekly market note',
    detail:
      'A short second email each week \u2014 what listed, what sold, what changed nearby. Goes out from a separate address so your monthly note stays out of promotions folders.',
    price: '$4',
    priceValue: 4,
    unit: '/mo',
    tier: 'extra',
    enabled: false,
  },
  {
    id: 'farm-street',
    title: 'Farm a street',
    detail:
      'Pick a street you\u2019d like to own. Everyone on it gets the same monthly note, whether or not they know you yet.',
    price: '$4',
    priceValue: 4,
    unit: '/mo per street',
    tier: 'extra',
    enabled: true,
    requiresForm: 'street',
  },
  {
    id: 'add-lender',
    title: 'Add my lender',
    detail: 'Their photo and license sit beside yours. They pay their own share.',
    price: 'Free',
    priceValue: 0,
    unit: '',
    tier: 'extra',
    enabled: false,
    requiresForm: 'lender',
  },
  {
    id: 'text-clients',
    title: 'Text my clients',
    detail:
      'Includes 250 texts a month. Extra texts are 2\u00a2 each. Requires a one-time carrier registration that takes a few days.',
    price: '$9',
    priceValue: 9,
    unit: '/mo',
    tier: 'texting',
    enabled: false,
    requiresForm: 'business',
  },
]

/** ~140 homes on the farmed street, kept separate from the agent's sphere. */
function generateFarm(count: number, street: string, city: string): Contact[] {
  const out: Contact[] = []
  for (let i = 0; i < count; i++) {
    const rand = seeded(i * 6607 + 101)
    const first = FIRST[(i * 2) % FIRST.length]
    const last = LAST[(i * 7) % LAST.length]
    const num = 100 + i * 2 + Math.floor(rand() * 2)
    const price = 560000 + Math.floor(rand() * 640000)
    const closedYear = 2009 + Math.floor(rand() * 16)
    const engRoll = rand()
    const engagement: Engagement =
      engRoll > 0.8 ? 'opened_recently' : engRoll > 0.4 ? 'quiet' : 'never_opened'
    out.push({
      id: `c-farm-${i}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${['gmail.com', 'outlook.com', 'yahoo.com'][i % 3]}`,
      address: `${num} ${street}`,
      city,
      closedDate: `${closedYear}-06-15`,
      status: 'matched' as ContactStatus,
      engagement,
      groups: [],
      source: 'farm',
      farmStreet: street,
      record: makeRecord(rand, price),
    })
  }
  return out
}

export const FARM_STREET = 'Oakdale Ave'

export const FARM_CONTACTS: Contact[] = generateFarm(140, FARM_STREET, 'San Dimas')
