import { afterAll } from 'vitest'
import { resetRuntimeDb } from '@/db/runtime'

afterAll(async () => {
  await resetRuntimeDb()
})
