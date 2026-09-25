import { z } from 'zod'
import type { AddonConfigSchema, ConfigField } from '@/addons/types'

/**
 * The form an add-on's config needs, read from its schema. Runs at registration, so a
 * schema the form cannot build breaks startup and the build, never a page.
 */
export function configFields(key: string, schema: AddonConfigSchema): ConfigField[] {
  if (!(schema instanceof z.ZodObject)) throw new Error(`Add-on ${key}: configSchema must be z.object(...)`)
  return Object.entries(schema.shape).map(([name, raw]) => {
    let field = raw as z.ZodType
    const optional = field instanceof z.ZodOptional
    if (optional) field = (field as z.ZodOptional<z.ZodType>).unwrap() as z.ZodType
    const label = (raw as z.ZodType).description ?? field.description
    if (!label) throw new Error(`Add-on ${key}: config field "${name}" needs .describe('Label the agent reads')`)
    if (field instanceof z.ZodString) return { name, label, kind: 'text' as const, optional }
    if (field instanceof z.ZodNumber) return { name, label, kind: 'number' as const, optional }
    if (field instanceof z.ZodBoolean) return { name, label, kind: 'boolean' as const, optional }
    if (field instanceof z.ZodEnum) return { name, label, kind: 'enum' as const, options: (field.options as string[]).map(String), optional }
    throw new Error(`Add-on ${key}: config field "${name}" must be a string, number, boolean, or enum`)
  })
}

/** Form values arrive as strings; turn each into what its field's schema expects. Empty is absent. */
export function coerceSubmitted(fields: ConfigField[], submitted: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const field of fields) {
    const value = submitted[field.name]
    if (field.kind === 'boolean') {
      out[field.name] = value === true || value === 'on' || value === 'true'
      continue
    }
    if (value === undefined || value === null || String(value).trim() === '') continue
    out[field.name] = field.kind === 'number' ? Number(value) : String(value).trim()
  }
  return out
}
