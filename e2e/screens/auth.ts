import { expect, type Page } from '@playwright/test'
import { holdRequests, isServerAction, TAKEN_EMAIL } from './prepare'
import type { Screen } from './types'

/**
 * Sign in and create account in their errors and their pending states (OR-044a). Nothing typed here
 * is a login: the mismatch uses an address with no account, and "taken" uses the one registered
 * address that has no usable password (Decision D).
 */
async function signIn(page: Page) {
  await page.getByLabel('Email').fill('nobody@example.invalid')
  await page.getByLabel('Password').fill('not-the-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
}

async function register(page: Page, email: string, password: string) {
  await page.getByLabel('Name').fill('Alex Rowe')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()
}

export const AUTH_SCREENS: Screen[] = [
  {
    name: 'login-mismatch',
    path: '/login',
    loggedOut: true,
    prepare: async (page) => {
      await signIn(page)
      await expect(page.locator('main').getByRole('alert')).toHaveText("That email and password don't match.")
    },
  },
  {
    // Decision C: the POST is held, so "Signing in…" stays, disabled, for the photograph.
    name: 'login-signing-in',
    path: '/login',
    loggedOut: true,
    prepare: async (page) => {
      await holdRequests(page, (headers, method) => isServerAction(headers, method))
      await signIn(page)
      await expect(page.getByRole('button', { name: 'Signing in…' })).toBeDisabled()
    },
  },
  { name: 'login-dark', path: '/login', loggedOut: true, colorScheme: 'dark' },
  {
    name: 'register-short-password',
    path: '/register',
    loggedOut: true,
    prepare: async (page) => {
      await register(page, 'alex@new-agent.example', 'short')
      await expect(page.getByText('Use at least 10 characters.')).toBeVisible()
    },
  },
  {
    name: 'register-taken',
    path: '/register',
    loggedOut: true,
    prepare: async (page) => {
      await register(page, TAKEN_EMAIL, 'long-enough-password')
      await expect(page.getByText('That email already has an account.')).toBeVisible()
    },
  },
  {
    name: 'register-creating',
    path: '/register',
    loggedOut: true,
    prepare: async (page) => {
      await holdRequests(page, (headers, method) => isServerAction(headers, method))
      await register(page, 'alex@new-agent.example', 'long-enough-password')
      await expect(page.getByRole('button', { name: 'Creating account…' })).toBeDisabled()
    },
  },
  { name: 'register-dark', path: '/register', loggedOut: true, colorScheme: 'dark' },
]
