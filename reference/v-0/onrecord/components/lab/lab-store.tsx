'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  SEED_AUDIENCES,
  SEED_AUTOMATIONS,
  SEED_CAMPAIGNS,
  type Audience,
  type Automation,
  type Campaign,
} from '@/lib/lab-data'

/** Extras and premium items the account can toggle on the Plans screen. */
export type PlanItem = {
  id: string
  name: string
  price: number
  unit: string
  band: 'extra' | 'premium'
  on: boolean
  note?: string
}

const SEED_PLAN_ITEMS: PlanItem[] = [
  { id: 'p-text-list', name: 'Text me the call list', price: 2, unit: '/mo', band: 'extra', on: true },
  { id: 'p-weekly', name: 'Weekly market note', price: 4, unit: '/mo', band: 'extra', on: false },
  { id: 'p-farm', name: 'Farm a street', price: 4, unit: '/street', band: 'extra', on: true },
  { id: 'p-lender', name: 'Add my lender', price: 0, unit: '', band: 'extra', on: false, note: 'Free' },
  {
    id: 'p-text-clients',
    name: 'Text my clients',
    price: 9,
    unit: '/mo',
    band: 'premium',
    on: false,
    note: 'includes 250 texts, 2\u00a2 after',
  },
  { id: 'p-campaigns', name: 'Campaign builder', price: 9, unit: '/mo', band: 'premium', on: false },
  { id: 'p-templates', name: 'Template library', price: 4, unit: '/mo', band: 'premium', on: false },
]

const BASE_PLAN = 19

export type SavedSegment = {
  id: string
  name: string
  count: number
  chips: string[]
}

type LabState = {
  campaigns: Campaign[]
  addCampaign: (c: Omit<Campaign, 'id'> & { id?: string }) => void
  setCampaignStatus: (id: string, status: Campaign['status']) => void
  removeCampaign: (id: string) => void

  savedSegments: SavedSegment[]
  saveSegment: (s: Omit<SavedSegment, 'id'>) => void

  audiences: Audience[]
  addAudience: (a: Audience) => void
  duplicateAudience: (id: string) => void
  renameAudience: (id: string, name: string) => void
  removeAudience: (id: string) => void

  automations: Automation[]
  toggleAutomation: (id: string) => void
  addAutomation: (a: Automation) => void

  planItems: PlanItem[]
  togglePlanItem: (id: string) => void
  basePlan: number
  monthlyTotal: number
}

const LabContext = createContext<LabState | null>(null)

export function LabStoreProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(SEED_CAMPAIGNS)
  const [audiences, setAudiences] = useState<Audience[]>(SEED_AUDIENCES)
  const [automations, setAutomations] = useState<Automation[]>(SEED_AUTOMATIONS)
  const [planItems, setPlanItems] = useState<PlanItem[]>(SEED_PLAN_ITEMS)
  const [savedSegments, setSavedSegments] = useState<SavedSegment[]>([])

  const addCampaign = useCallback(
    (c: Omit<Campaign, 'id'> & { id?: string }) => {
      const withId: Campaign = { ...c, id: c.id ?? `cmp-${Date.now()}` }
      setCampaigns((prev) => [withId, ...prev.filter((p) => p.id !== withId.id)])
    },
    [],
  )

  const saveSegment = useCallback((s: Omit<SavedSegment, 'id'>) => {
    setSavedSegments((prev) => [
      { ...s, id: `seg-${Date.now()}` },
      ...prev,
    ])
  }, [])
  const setCampaignStatus = useCallback(
    (id: string, status: Campaign['status']) => {
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id && !c.locked ? { ...c, status } : c)),
      )
    },
    [],
  )
  const removeCampaign = useCallback((id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id || c.locked))
  }, [])

  const addAudience = useCallback((a: Audience) => {
    setAudiences((prev) => [...prev, a])
  }, [])
  const duplicateAudience = useCallback((id: string) => {
    setAudiences((prev) => {
      const src = prev.find((a) => a.id === id)
      if (!src) return prev
      return [
        ...prev,
        { ...src, id: `${src.id}-copy-${Date.now()}`, name: `${src.name} (copy)` },
      ]
    })
  }, [])
  const renameAudience = useCallback((id: string, name: string) => {
    setAudiences((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)))
  }, [])
  const removeAudience = useCallback((id: string) => {
    setAudiences((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const toggleAutomation = useCallback((id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, on: !a.on } : a)),
    )
  }, [])
  const addAutomation = useCallback((a: Automation) => {
    setAutomations((prev) => [...prev, a])
  }, [])

  const togglePlanItem = useCallback((id: string) => {
    setPlanItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, on: !p.on } : p)),
    )
  }, [])

  const monthlyTotal = useMemo(
    () => BASE_PLAN + planItems.filter((p) => p.on).reduce((s, p) => s + p.price, 0),
    [planItems],
  )

  const value = useMemo<LabState>(
    () => ({
      campaigns,
      addCampaign,
      setCampaignStatus,
      removeCampaign,
      savedSegments,
      saveSegment,
      audiences,
      addAudience,
      duplicateAudience,
      renameAudience,
      removeAudience,
      automations,
      toggleAutomation,
      addAutomation,
      planItems,
      togglePlanItem,
      basePlan: BASE_PLAN,
      monthlyTotal,
    }),
    [
      campaigns,
      addCampaign,
      setCampaignStatus,
      removeCampaign,
      savedSegments,
      saveSegment,
      audiences,
      addAudience,
      duplicateAudience,
      renameAudience,
      removeAudience,
      automations,
      toggleAutomation,
      addAutomation,
      planItems,
      togglePlanItem,
      monthlyTotal,
    ],
  )

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>
}

export function useLab() {
  const ctx = useContext(LabContext)
  if (!ctx) throw new Error('useLab must be used within LabStoreProvider')
  return ctx
}

/** Alias used across lab screens. */
export const useLabStore = useLab
