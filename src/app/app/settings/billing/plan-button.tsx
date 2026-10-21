'use client'

import { useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { buttonClass } from '@/app/app/people/ui'

/** Do not accept a plan change until its action handler is ready. */
export function PlanButton({ label }: { label: string }) {
  const [ready, setReady] = useState(false)
  const { pending } = useFormStatus()
  useEffect(() => setReady(true), [])

  return <button className={buttonClass} type="submit" disabled={!ready || pending}>{label}</button>
}
