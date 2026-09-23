export type DeliveryMark = {
  email: string
  bounced: boolean
  complained: boolean
}

export type DomainDelivery = {
  domain: string
  sent: number
  delivered: number
  bounced: number
  complained: number
  bounceRate: number | null
  complaintRate: number | null
}

export type DeliveryTotals = {
  sent: number
  delivered: number
  bounced: number
  complained: number
  unsubscribed: number
  bounceRate: number | null
  complaintRate: number | null
  domains: DomainDelivery[]
}

export function domainOf(email: string) {
  const at = email.lastIndexOf('@')
  const domain = at >= 0 ? email.slice(at + 1).trim().toLowerCase() : ''
  return domain || 'unknown'
}

export function formatRate(rate: number | null) {
  if (rate == null) return '—'
  return `${(rate * 100).toFixed(1)}%`
}

function ratio(part: number, whole: number) {
  if (whole <= 0) return null
  return part / whole
}

/** More than 0.1% complaints, and at least 50 messages that were delivered. */
export function shouldPause(delivered: number, complained: number) {
  return delivered >= 50 && complained * 1000 > delivered
}

export function tallyDelivery(
  sent: { email: string }[],
  events: { email: string | null; kind: string }[],
  unsubscribed: number,
): DeliveryTotals {
  const bouncedEmails = new Set<string>()
  const complainedEmails = new Set<string>()
  for (const event of events) {
    const email = event.email?.trim().toLowerCase()
    if (!email) continue
    if (event.kind === 'spam_complaint') complainedEmails.add(email)
    if (event.kind === 'hard_bounce') bouncedEmails.add(email)
  }

  const byDomain = new Map<string, DomainDelivery>()
  let bounced = 0
  let complained = 0
  for (const row of sent) {
    const email = row.email.trim().toLowerCase()
    const domain = domainOf(email)
    const bucket = byDomain.get(domain) ?? {
      domain,
      sent: 0,
      delivered: 0,
      bounced: 0,
      complained: 0,
      bounceRate: null,
      complaintRate: null,
    }
    bucket.sent += 1
    const markedComplaint = complainedEmails.has(email)
    const markedBounce = bouncedEmails.has(email) && !markedComplaint
    if (markedComplaint) {
      complained += 1
      bucket.complained += 1
    } else if (markedBounce) {
      bounced += 1
      bucket.bounced += 1
    }
    byDomain.set(domain, bucket)
  }

  const domains = [...byDomain.values()]
    .map((bucket) => {
      const delivered = bucket.sent - bucket.bounced
      return {
        ...bucket,
        delivered,
        bounceRate: ratio(bucket.bounced, bucket.sent),
        complaintRate: ratio(bucket.complained, delivered),
      }
    })
    .sort((left, right) => right.sent - left.sent || left.domain.localeCompare(right.domain))

  const sentCount = sent.length
  const delivered = sentCount - bounced
  return {
    sent: sentCount,
    delivered,
    bounced,
    complained,
    unsubscribed,
    bounceRate: ratio(bounced, sentCount),
    complaintRate: ratio(complained, delivered),
    domains,
  }
}

export function blocksInStoredHtml(html: string) {
  return [...html.matchAll(/<!--block:([a-z_]+)-->/g)].map((match) => match[1] ?? '')
}

export function groupSkipReasons(skips: { reason: string }[]) {
  const counts = new Map<string, number>()
  for (const skip of skips) {
    counts.set(skip.reason, (counts.get(skip.reason) ?? 0) + 1)
  }
  return [...counts.entries()].map(([reason, count]) => ({ reason, count }))
}
