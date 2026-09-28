import { z } from 'zod'
import type { AddonConfig, AddonDefinition } from '@/addons/types'
import { normalizeUsPhone } from '@/config/phone'

export const LENDER_KEY = 'lender'

export const lenderSchema = z.object({
  name: z.string().trim().min(2, "Enter the lender's full name.").describe("Lender's full name"),
  nmls: z.string().trim().regex(/^[\d-]{6,8}$/, 'NMLS is 6 to 8 digits, numbers only.').describe('NMLS number'),
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter an email like name@lender.com.').describe("Lender's email"),
  phone: z
    .string()
    .trim()
    .refine((value) => normalizeUsPhone(value) !== null, 'Use a US phone number, like 909-555-0147.')
    .optional()
    .describe('Phone'),
  company: z.string().trim().optional().describe('Company'),
})

export type LenderConfig = z.infer<typeof lenderSchema>

/** A stored config as the lender, or null if it no longer validates. */
export function parseLender(config: AddonConfig | null): LenderConfig | null {
  if (!config) return null
  const parsed = lenderSchema.safeParse(config)
  return parsed.success ? parsed.data : null
}

/** Free. The agent's lender partner beside them at the bottom of each note. No charge to anyone. */
export const LENDER: AddonDefinition = {
  key: LENDER_KEY,
  title: 'Add my lender',
  blurb: "Your lender partner's name and NMLS, beside yours at the bottom of each note.",
  band: 'extras',
  requiresConfig: true,
  configSchema: lenderSchema,
  rowNote: 'Takes effect on the next note.',
  summary(config) {
    const lender = parseLender(config)
    return lender ? `${lender.name} · NMLS ${lender.nmls}` : null
  },
}
