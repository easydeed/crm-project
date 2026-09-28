import { readFileSync } from 'node:fs'
import { expect, test as setup } from '@playwright/test'

setup('log in as the seeded agent', async ({ page }) => {
  const state = JSON.parse(readFileSync('e2e/.state.json', 'utf8')) as { email: string; password: string }
  await page.goto('/login')
  await page.getByLabel('Email').fill(state.email)
  await page.getByLabel('Password').fill(state.password)
  await page.getByRole('button', { name: /log in|sign in/i }).click()
  await expect(page).toHaveURL(/\/app/)
  await page.context().storageState({ path: 'test-results/auth.json' })
})
