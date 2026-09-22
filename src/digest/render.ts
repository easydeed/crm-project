import { renderFooter } from '@/digest/blocks/footer'
import { renderFourDoors } from '@/digest/blocks/four-doors'
import { pickHeadline, renderGreeting } from '@/digest/blocks/greeting'
import { renderHeader } from '@/digest/blocks/header'
import { renderLoan } from '@/digest/blocks/loan'
import { renderRecord } from '@/digest/blocks/record'
import { renderReply } from '@/digest/blocks/reply'
import { renderStreetSales } from '@/digest/blocks/street-sales'
import { renderTaxes } from '@/digest/blocks/taxes'
import { wrapEmail } from '@/digest/email'
import type { BlockOutput, DigestInput, DigestResult } from '@/digest/types'

const THIN_REASON =
  'Not enough of the record is in yet to send a useful note this month.'

export function renderDigest(input: DigestInput): DigestResult {
  const content = [
    renderRecord(input.parcel, input.events, input.asOf),
    renderFourDoors(input.parcel, input.nearbyListing),
    renderTaxes(input),
    renderStreetSales(input.streetSales),
    renderLoan(input.events),
  ].filter((block): block is BlockOutput => Boolean(block))

  if (content.length < 2) {
    return { send: false, reason: THIN_REASON }
  }

  const blocks = content.map((block) => block.name)
  const headline = pickHeadline(blocks)
  const accent = input.agent.accentColor || '#1f4d3a'
  const header = renderHeader(input.agent, accent)
  const greeting = renderGreeting(input.contact.firstName, headline)
  const reply = renderReply(input.agent, accent)
  const footer = renderFooter(input.agent)
  const html = wrapEmail(headline, [
    header.html,
    greeting.html,
    ...content.map((block) => block.html),
    reply.html,
    footer.html,
  ], accent)
  const text = [
    header.text,
    greeting.text,
    ...content.map((block) => block.text),
    reply.text,
    footer.text,
  ].join('\n\n')

  return { send: true, subject: headline, html, text, blocks }
}
