import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test, vi } from 'vitest'
vi.mock('@/app/app/settings/billing/actions', () => ({ retryTextingStopAction: async () => {} }))
import { TextingRecovery } from '@/app/app/settings/billing/texting-recovery'
import { TextNoticeLine } from '@/app/app/text-notice'

test('pending and exhausted notices lead to an explanatory Billing section with a real retry action', () => {
  for (const notice of ['billing_pending', 'billing_failed'] as const) {
    expect(renderToStaticMarkup(createElement(TextNoticeLine, { notice }))).toContain('/app/settings/billing#texting-recovery')
  }
  const html = (state: 'pending' | 'failed', readOnly = false) => renderToStaticMarkup(createElement(TextingRecovery, { state, readOnly, accountId: 'account' }))
  expect(html('pending')).toContain('retrying automatically')
  expect(html('pending')).toContain('may still be billed')
  expect(html('failed')).toContain('Automatic retries have stopped')
  expect(html('failed')).toContain('Retry texting switch-off')
  expect(html('failed')).toContain('<form')
  expect(html('failed', true)).not.toContain('<form')
  expect(html('failed')).toContain('mailto:')
})
