import { streetNameNorm } from '@/matching/normalize'

export function withStreetNameNorm<T extends { address: string }>(
  row: T,
): T & { streetNameNorm: string } {
  return { ...row, streetNameNorm: streetNameNorm(row.address) }
}
