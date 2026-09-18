export const CA_TAX = {
  effectiveDate: '2026-07-01',
  reviewBy: '2027-07-01',
  prop13AnnualCapPct: 0.02,
  defaultTaxRatePct: 0.0115, // LA County incl. direct assessments
  counties: [
    'Los Angeles',
    'Orange',
    'Ventura',
    'San Diego',
    'Riverside',
    'San Bernardino',
  ],
} as const
