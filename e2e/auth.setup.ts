import { readFileSync } from 'node:fs'
import { expect, test as setup, type Page } from '@playwright/test'

const state = JSON.parse(readFileSync('e2e/.state.json', 'utf8')) as { email: string; password: string; quietEmail: string }

async function logIn(page: Page, email: string, path: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(state.password)
  await page.getByRole('button', { name: /log in|sign in/i }).click()
  await expect(page).toHaveURL(/\/app/)
  await page.context().storageState({ path })
}

setup('log in as the seeded agent', async ({ page }) => {
  await logIn(page, state.email, 'test-results/auth.json')
})

// The quiet agent (OR-043): nothing recent on any of its people, so its dashboard is "Been a while".
setup('log in as the quiet agent', async ({ browser }) => {
  const page = await browser.newPage()
  await logIn(page, state.quietEmail, 'test-results/auth-quiet.json')
  await page.close()
})
