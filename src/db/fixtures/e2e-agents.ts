import { AGENT_ID, agent } from '@/db/fixtures/la-verne'
import { QUIET_AGENT_ID, quietAgent } from '@/db/fixtures/e2e-live'
import { PLAN } from '@/config/costs'

/**
 * The browser pass's agents (OR-044a). Each one exists to show a state, says which in `expects`,
 * and e2e-setup fails if the real loaders disagree. A state that only a database row can produce
 * gets an agent here, never a prepare step that writes to data another capture reads.
 *
 * Local scratch database only, like the rest of e2e setup. Never the seed.
 */

export type AgentKey =
  | 'dana' | 'quiet' | 'empty' | 'groups' | 'paused' | 'systemPaused' | 'pastDue' | 'setToEnd'
  | 'ended' | 'spare' | 'noPlan' | 'missing' | 'unreachable' | 'extrasOn' | 'admin' | 'taken'

export type E2EInvoice = { id: string; created: string; status: 'paid' | 'open'; url: string | null }

/** `known` is in the e2e Stripe stand-in; `missing` is a 404 there; `unreachable` fails like a network error. */
export type E2EBilling =
  | { plan: 'none' }
  | { plan: 'stripe'; status: 'active' | 'past_due' | 'canceled'; cancelAtPeriodEnd?: boolean; gateway: 'known' | 'missing' | 'unreachable'; invoices: E2EInvoice[] }

export type E2EAgent = {
  key: AgentKey
  id: string
  email: string
  name: string
  /** False for the seeded agent, whose account the seed already made. */
  insert: boolean
  /** False for an account whose email is only ever typed into a form: it has no usable password. */
  login: boolean
  role?: 'agent' | 'admin'
  phone?: string | null
  phoneVerified?: boolean
  sendTime?: string
  paused?: boolean
  /** The latest admin action on the account: a complaint pause is what the system-paused line names. */
  complaintPause?: boolean
  billing: E2EBilling
  /** Copies of the seeded agent's matched people away from Oakdale (OR-043's quiet-agent rule). */
  people?: { copies: number; ownEmails?: boolean; noEmail?: number; unsubscribed?: number }
  groups?: { name: string; members: number[] }[]
  addons?: { key: string; config: Record<string, unknown> }[]
  expects: {
    home?: string
    /** The billing page's view: none, missing, unreachable (it throws), or the Stripe status. */
    billing?: 'none' | 'missing' | 'unreachable' | 'active' | 'set-to-end' | 'past_due' | 'canceled'
    people?: number
    phone?: 'none' | 'unverified' | 'verified'
  }
}

const PERIOD_END = '2099-01-01T00:00:00Z'
const PAID = (key: string, url: string | null): E2EInvoice[] => [
  { id: `in_e2e_${key}_2`, created: '2026-09-01T16:00:00Z', status: 'paid', url },
  { id: `in_e2e_${key}_1`, created: '2026-08-01T16:00:00Z', status: 'paid', url: null },
]
/** A reserved domain (RFC 2606): an invoice link that is a link, and goes nowhere real. */
const invoiceUrl = (id: string) => `https://billing.example/invoices/${id}`

/** Fixed ids, so ties and orderings never move between reseeds. */
export const agentId = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`
export const agentContactId = (n: number, index: number) => `00000000-0000-4000-80${n.toString(16).padStart(2, '0')}-${(index + 1).toString(16).padStart(12, '0')}`

type Stripe = Extract<E2EBilling, { plan: 'stripe' }>
const stripe = (key: string, over: Partial<Stripe> = {}): Stripe => ({ plan: 'stripe', status: 'active', gateway: 'known', invoices: PAID(key, null), ...over })
const SET_UP = { sendTime: '09:00' }

function made(n: number, key: AgentKey, name: string, rest: Omit<E2EAgent, 'key' | 'id' | 'email' | 'name' | 'insert' | 'login'> & { login?: boolean }): E2EAgent {
  return { key, id: agentId(n), email: `${key.toLowerCase()}@agents.example`, name, insert: true, login: true, ...rest }
}

export const E2E_AGENTS: E2EAgent[] = [
  // Decision A: the seeded agent has finished setup, so her dashboard is the scheduled card.
  { key: 'dana', id: AGENT_ID, email: agent.email, name: agent.name, insert: false, login: true, ...SET_UP, billing: stripe(''), expects: { home: 'scheduled', billing: 'active', phone: 'unverified' } },
  // The quiet agent keeps a null send time: "Set when the note goes out." stays captured.
  { key: 'quiet', id: QUIET_AGENT_ID, email: quietAgent.email, name: quietAgent.name, insert: true, login: true, phone: quietAgent.phone, billing: stripe('quiet'), people: { copies: 3 }, expects: { home: 'settings', billing: 'active', people: 3 } },
  made(3, 'empty', 'Jordan Pike', { phone: null, ...SET_UP, billing: stripe('empty'), expects: { home: 'import', people: 0, phone: 'none' } }),
  made(4, 'groups', 'Casey Moreno', {
    billing: stripe('groups'),
    people: { copies: 6, ownEmails: true, noEmail: 1, unsubscribed: 1 },
    groups: [{ name: 'Open house', members: [3, 4] }, { name: 'Past clients', members: [0, 1, 2] }],
    expects: { home: 'settings', people: 7 },
  }),
  made(5, 'paused', 'Morgan Lee', { ...SET_UP, paused: true, billing: stripe('paused'), expects: { home: 'paused' } }),
  made(6, 'systemPaused', 'Riley Shah', { ...SET_UP, paused: true, complaintPause: true, billing: stripe('systemPaused'), expects: { home: 'system-paused' } }),
  made(7, 'pastDue', 'Avery Cole', {
    billing: stripe('pastDue', { status: 'past_due', invoices: [{ id: 'in_e2e_pastDue_3', created: '2026-10-01T16:00:00Z', status: 'open', url: invoiceUrl('in_e2e_pastDue_3') }, ...PAID('pastDue', null)] }),
    expects: { home: 'billing', billing: 'past_due' },
  }),
  made(8, 'setToEnd', 'Taylor Brooks', { billing: stripe('setToEnd', { cancelAtPeriodEnd: true, invoices: PAID('setToEnd', invoiceUrl('in_e2e_setToEnd_2')) }), expects: { billing: 'set-to-end' } }),
  made(9, 'ended', 'Quinn Park', { billing: stripe('ended', { status: 'canceled' }), expects: { home: 'billing', billing: 'canceled' } }),
  made(10, 'noPlan', 'Drew Adler', { billing: { plan: 'none' }, expects: { home: 'billing', billing: 'none' } }),
  made(11, 'missing', 'Sam Ortiz', { billing: stripe('missing', { gateway: 'missing' }), expects: { billing: 'missing' } }),
  made(12, 'unreachable', 'Jesse Kim', { billing: stripe('unreachable', { gateway: 'unreachable' }), expects: { billing: 'unreachable' } }),
  made(13, 'extrasOn', 'Rowan Hale', {
    phone: '909-555-0193',
    phoneVerified: true,
    billing: stripe('extrasOn'),
    addons: [
      { key: 'lender', config: { name: 'Pat Rivera', nmls: '1234567', email: 'pat@lender.example' } },
      { key: 'text_call_list', config: { phone: '+19095550193' } },
    ],
    expects: { phone: 'verified' },
  }),
  made(16, 'spare', 'Spare Agent', { billing: { plan: 'none' }, expects: {} }),
  // Decision B: a real admin, who signs in and clicks View as.
  made(14, 'admin', 'Ops Admin', { role: 'admin', billing: { plan: 'none' }, expects: {} }),
  // Decision D: an address that is registered and is not a login.
  made(15, 'taken', 'Already Registered', { login: false, billing: { plan: 'none' }, expects: {} }),
]

export function e2eAgent(key: AgentKey): E2EAgent {
  const found = E2E_AGENTS.find((row) => row.key === key)
  if (!found) throw new Error(`No e2e agent ${key}`)
  return found
}

/** Stripe ids, as e2e-setup writes them and the e2e stand-in knows them. The seeded agent keeps OR-017c's. */
export function stripeIds(row: E2EAgent) {
  return row.key === 'dana' ? { sub: 'sub_e2e', customer: 'cus_e2e' } : { sub: `sub_e2e_${row.key}`, customer: `cus_e2e_${row.key}` }
}

export const E2E_PERIOD_END = new Date(PERIOD_END)
export const E2E_PLAN_CENTS = PLAN.priceCents
