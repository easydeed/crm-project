'use client'

import { useEffect, useState } from 'react'
import { buttonClass } from '@/app/app/people/ui'

export function SaveButton({
  pending,
  savedAt,
  readOnly,
}: {
  pending: boolean
  savedAt?: number
  readOnly?: boolean
}) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!savedAt) return
    setSaved(true)
    const timer = window.setTimeout(() => setSaved(false), 2000)
    return () => window.clearTimeout(timer)
  }, [savedAt])

  return (
    <button
      className={`${buttonClass} mt-4`}
      type="submit"
      disabled={pending || readOnly}
    >
      {pending ? 'Saving…' : saved ? 'Saved' : 'Save'}
    </button>
  )
}
