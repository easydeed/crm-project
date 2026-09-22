export const BODY_FONT = "Georgia, 'Times New Roman', serif"
export const LABEL_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export const ink = '#1a1a1a'
export const paper = '#f7f3ea'
export const stamp = '#3d2a1f'
export const rule = '#c9bfae'

export function labelStyle() {
  return `font-family:${LABEL_FONT};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${stamp};`
}

export function bodyStyle() {
  return `font-family:${BODY_FONT};font-size:17px;line-height:1.5;color:${ink};`
}

export function sectionHtml(inner: string) {
  return `<tr><td style="padding:20px 28px 8px 28px;${bodyStyle()}">${inner}</td></tr>`
}
