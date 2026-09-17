'use client'

import { useEffect, useState } from 'react'

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
      className="mt-4 rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-60"
      type="submit"
      disabled={pending || readOnly}
    >
      {pending ? 'Saving…' : saved ? 'Saved' : 'Save'}
    </button>
  )
}
