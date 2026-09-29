'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Addon, BusinessInfo, Contact, TextingStatus } from './types'
import {
  CALL_SIGNALS,
  FARM_CONTACTS,
  FARM_STREET,
  SEED_ADDONS,
  SEED_CONTACTS,
  SEED_GROUPS,
} from './mock-data'

export const BILLING = {
  card: 'Visa 4417',
  nextCharge: 'October 1',
  textCap: 250,
  overageCents: 2,
} as const

const EMPTY_BUSINESS: BusinessInfo = {
  legalName: '',
  address: '',
  taxKind: 'ein',
  ein: '',
  website: '',
  sampleMessage: '',
}

export type Profile = {
  name: string
  email: string
  phone: string
  brokerage: string
  dre: string
  headshot: string | null
}

export type EmailLook = {
  senderName: string
  replyTo: string
  brandColor: string
}

export type Sending = {
  sendDay: '1' | '15'
  timeOfDay: string
  timezone: string
  paused: boolean
}

export type LenderInfo = { name: string; nmls: string; email: string }

type Store = {
  // people
  contacts: Contact[]
  addContact: (c: Omit<Contact, 'id'>) => string
  updateContact: (id: string, patch: Partial<Contact>) => void
  deleteContact: (id: string) => void
  deleteContacts: (ids: string[]) => void
  addContactsToGroup: (ids: string[], group: string) => void
  removeContactsFromGroup: (ids: string[], group: string) => void
  importContacts: (rows: Omit<Contact, 'id'>[]) => void
  // groups
  groups: string[]
  addGroup: (name: string) => void
  renameGroup: (from: string, to: string) => void
  deleteGroup: (name: string) => void
  // add-ons
  addons: Addon[]
  toggleAddon: (id: string) => void
  lenderInfo: LenderInfo
  setLenderInfo: (v: LenderInfo) => void
  watchStreet: string
  setWatchStreet: (v: string) => void
  // client texting
  textingStatus: TextingStatus
  setTextingStatus: (v: TextingStatus) => void
  businessInfo: BusinessInfo
  setBusinessInfo: (v: BusinessInfo) => void
  textsUsed: number
  // farm
  farmContacts: Contact[]
  farmStreet: string
  // profile / settings
  profile: Profile
  setProfile: (p: Partial<Profile>) => void
  emailLook: EmailLook
  setEmailLook: (v: Partial<EmailLook>) => void
  sending: Sending
  setSending: (v: Partial<Sending>) => void
  // dashboard
  monthSkipped: boolean
  setMonthSkipped: (v: boolean) => void
  // signals
  signals: typeof CALL_SIGNALS
  calledIds: string[]
  markCalled: (id: string) => void
}

const StoreContext = createContext<Store | null>(null)

let idCounter = 1000
const nextId = () => `c-new-${idCounter++}`

export function StoreProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>(SEED_CONTACTS)
  const [groups, setGroups] = useState<string[]>(SEED_GROUPS)
  const [addons, setAddons] = useState<Addon[]>(SEED_ADDONS)
  const [lenderInfo, setLenderInfoState] = useState<LenderInfo>({
    name: '',
    nmls: '',
    email: '',
  })
  const [watchStreet, setWatchStreetState] = useState(FARM_STREET)
  const [monthSkipped, setMonthSkipped] = useState(false)
  const [calledIds, setCalledIds] = useState<string[]>([])
  const [textingStatus, setTextingStatus] = useState<TextingStatus>('off')
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(EMPTY_BUSINESS)

  const [profile, setProfileState] = useState<Profile>({
    name: 'Dana Whitfield',
    email: 'dana@coastlinerealty.com',
    phone: '(909) 555-0100',
    brokerage: 'Coastline Realty',
    dre: '01998432',
    headshot: null,
  })
  const [emailLook, setEmailLookState] = useState<EmailLook>({
    senderName: 'Dana Whitfield',
    replyTo: 'dana@coastlinerealty.com',
    brandColor: '#2F5BFF',
  })
  const [sending, setSendingState] = useState<Sending>({
    sendDay: '1',
    timeOfDay: '7:00 AM',
    timezone: 'Pacific (PT)',
    paused: false,
  })

  const value = useMemo<Store>(() => {
    return {
      contacts,
      addContact: (c) => {
        const id = nextId()
        setContacts((prev) => [{ ...c, id }, ...prev])
        return id
      },
      updateContact: (id, patch) =>
        setContacts((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        ),
      deleteContact: (id) =>
        setContacts((prev) => prev.filter((c) => c.id !== id)),
      deleteContacts: (ids) =>
        setContacts((prev) => prev.filter((c) => !ids.includes(c.id))),
      addContactsToGroup: (ids, group) =>
        setContacts((prev) =>
          prev.map((c) =>
            ids.includes(c.id) && !c.groups.includes(group)
              ? { ...c, groups: [...c.groups, group] }
              : c,
          ),
        ),
      removeContactsFromGroup: (ids, group) =>
        setContacts((prev) =>
          prev.map((c) =>
            ids.includes(c.id)
              ? { ...c, groups: c.groups.filter((g) => g !== group) }
              : c,
          ),
        ),
      importContacts: (rows) =>
        setContacts((prev) => [
          ...rows.map((r) => ({ ...r, id: nextId() })),
          ...prev,
        ]),
      groups,
      addGroup: (name) =>
        setGroups((prev) =>
          prev.includes(name) ? prev : [...prev, name],
        ),
      renameGroup: (from, to) => {
        setGroups((prev) => prev.map((g) => (g === from ? to : g)))
        setContacts((prev) =>
          prev.map((c) => ({
            ...c,
            groups: c.groups.map((g) => (g === from ? to : g)),
          })),
        )
      },
      deleteGroup: (name) => {
        setGroups((prev) => prev.filter((g) => g !== name))
        setContacts((prev) =>
          prev.map((c) => ({
            ...c,
            groups: c.groups.filter((g) => g !== name),
          })),
        )
      },
      addons,
      toggleAddon: (id) =>
        setAddons((prev) =>
          prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
        ),
      lenderInfo,
      setLenderInfo: setLenderInfoState,
      watchStreet,
      setWatchStreet: setWatchStreetState,
      textingStatus,
      setTextingStatus,
      businessInfo,
      setBusinessInfo,
      textsUsed: 62,
      farmContacts: FARM_CONTACTS,
      farmStreet: FARM_STREET,
      profile,
      setProfile: (p) => setProfileState((prev) => ({ ...prev, ...p })),
      emailLook,
      setEmailLook: (v) => setEmailLookState((prev) => ({ ...prev, ...v })),
      sending,
      setSending: (v) => setSendingState((prev) => ({ ...prev, ...v })),
      monthSkipped,
      setMonthSkipped,
      signals: CALL_SIGNALS,
      calledIds,
      markCalled: (id) =>
        setCalledIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
    }
  }, [
    contacts,
    groups,
    addons,
    lenderInfo,
    watchStreet,
    textingStatus,
    businessInfo,
    profile,
    emailLook,
    sending,
    monthSkipped,
    calledIds,
  ])

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
