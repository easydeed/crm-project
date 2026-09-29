/**
 * GSM-7 vs UCS-2 aware SMS segmentation, matching how carriers actually bill.
 * A single non-GSM character (emoji, curly quote) forces the whole message to
 * UCS-2, which roughly halves the per-segment budget — a real gotcha agents hit.
 */

// The GSM 03.38 basic character set (plus the extension chars that cost 2).
const GSM_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
const GSM_EXTENDED = '^{}\\[~]|€'

export type SmsInfo = {
  chars: number
  encoding: 'GSM-7' | 'UCS-2'
  perSegment: number
  segments: number
  nonGsmChars: string[]
}

export function analyzeSms(text: string): SmsInfo {
  const chars = [...text]
  const nonGsm = new Set<string>()

  let gsmUnits = 0
  let isUnicode = false

  for (const ch of chars) {
    if (GSM_BASIC.includes(ch)) {
      gsmUnits += 1
    } else if (GSM_EXTENDED.includes(ch)) {
      gsmUnits += 2
    } else {
      isUnicode = true
      nonGsm.add(ch)
    }
  }

  if (isUnicode) {
    // UCS-2: 70 chars single, 67 per concatenated segment.
    const len = chars.length
    const perSegment = len > 70 ? 67 : 70
    const segments = len === 0 ? 0 : Math.ceil(len / perSegment)
    return {
      chars: len,
      encoding: 'UCS-2',
      perSegment,
      segments: Math.max(segments, len > 0 ? 1 : 0),
      nonGsmChars: [...nonGsm],
    }
  }

  // GSM-7: 160 single, 153 per concatenated segment.
  const perSegment = gsmUnits > 160 ? 153 : 160
  const segments = gsmUnits === 0 ? 0 : Math.ceil(gsmUnits / perSegment)
  return {
    chars: gsmUnits,
    encoding: 'GSM-7',
    perSegment,
    segments,
    nonGsmChars: [],
  }
}
