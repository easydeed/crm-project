import { afterEach, expect, test, vi } from 'vitest'
import type { DetailsState } from '@/app/app/settings/types'

const mocks = vi.hoisted(() => ({ save: vi.fn<() => Promise<DetailsState>>(), refresh: vi.fn() }))
vi.mock('@/auth/current-session', () => ({ readRequestSession: async () => ({ accountId: 'test-account', role: 'agent', exp: 2000000000 }) }))
vi.mock('@/app/app/settings/save', () => ({ saveDetails: mocks.save, saveAppearance: vi.fn(), saveSending: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.refresh }))
import { saveDetailsAction } from '@/app/app/settings/actions'

afterEach(() => { mocks.save.mockReset(); mocks.refresh.mockReset() })

test('partial phone save refreshes persisted details without success', async () => {
  const result = { error: 'Paid switch-off failed', detailsPersisted: true }
  mocks.save.mockResolvedValue(result)
  expect(await saveDetailsAction({}, new FormData())).toEqual(result)
  expect(mocks.refresh).toHaveBeenCalledExactlyOnceWith('/app/settings')
  expect(result).not.toHaveProperty('savedAt')
  expect(result).not.toHaveProperty('notice')
})

test('validation failure does not refresh away unpersisted input', async () => {
  const result = { phone: 'Use a US phone number.' }
  mocks.save.mockResolvedValue(result)
  expect(await saveDetailsAction({}, new FormData())).toEqual(result)
  expect(mocks.refresh).not.toHaveBeenCalled()
})

test('successful details save refreshes current account fields', async () => {
  const result = { savedAt: 2000000000000 }
  mocks.save.mockResolvedValue(result)
  expect(await saveDetailsAction({}, new FormData())).toEqual(result)
  expect(mocks.refresh).toHaveBeenCalledExactlyOnceWith('/app/settings')
})
