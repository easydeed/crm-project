'use client'

import { DigestPreviewPanel } from '@/app/digest/preview-panel'
import { applyPreviewLook, type PreviewLook } from '@/digest/apply-look'
import { SAMPLE_LABEL } from '@/digest/skip-copy'
import type { DigestResult } from '@/digest/types'

export function AppearancePreview({
  result,
  sample,
  saved,
  live,
}: {
  result: DigestResult
  sample: boolean
  saved: PreviewLook
  live: PreviewLook
}) {
  const preview: DigestResult = result.send
    ? {
        ...result,
        ...applyPreviewLook(result.html, result.text, saved, live),
      }
    : result

  return (
    <DigestPreviewPanel
      title="Preview"
      sampleLabel={sample ? SAMPLE_LABEL : undefined}
      result={preview}
    />
  )
}
