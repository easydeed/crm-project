import { escapeHtml } from '@/digest/format'

export type PreviewLook = {
  sender: string
  accent: string
}

export function senderFrom(agent: {
  name: string
  senderName: string | null
}) {
  return agent.senderName?.trim() || agent.name
}

export function accentFrom(accentColor: string | null) {
  return accentColor || '#1f4d3a'
}

export function applyPreviewLook(
  html: string,
  text: string,
  saved: PreviewLook,
  live: PreviewLook,
) {
  let nextHtml = html
  let nextText = text
  if (saved.accent !== live.accent) {
    nextHtml = nextHtml.split(saved.accent).join(live.accent)
  }
  if (saved.sender !== live.sender) {
    nextHtml = nextHtml.split(escapeHtml(saved.sender)).join(escapeHtml(live.sender))
    nextText = nextText.split(saved.sender).join(live.sender)
  }
  return { html: nextHtml, text: nextText }
}
