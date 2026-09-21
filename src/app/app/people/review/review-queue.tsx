'use client'

import { useEffect, useState, useTransition } from 'react'
import { CandidateCards } from '@/app/app/people/review/candidate-cards'
import { DoneState } from '@/app/app/people/review/done-state'
import { NoParcelPanel } from '@/app/app/people/review/no-parcel-panel'
import {
  chooseReviewCandidateAction,
  fixReviewAddressAction,
  leaveOutReviewContactAction,
  undoReviewDecisionAction,
} from '@/app/app/people/review/actions'
import { buttonClass, mutedClass } from '@/app/app/people/ui'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'
import type { ReviewQueueItem, ReviewSnapshot } from '@/db/review-types'
import { REVIEW_NONE_OF_THESE, REVIEW_UNDO, REVIEW_YOU_GAVE_US } from '@/people/review-copy'
import { reviewHeader } from '@/people/review-state'

const UNDO_MS = 5000

export function ReviewQueue({
  items,
  startIndex,
  leftOutCount,
  readOnly,
  mode = 'queue',
}: {
  items: ReviewQueueItem[]
  startIndex: number
  leftOutCount: number
  readOnly: boolean
  mode?: 'queue' | 'wrong-house'
}) {
  const [list, setList] = useState(items)
  const [index, setIndex] = useState(Math.min(startIndex, Math.max(items.length - 1, 0)))
  const [leftOut, setLeftOut] = useState(leftOutCount)
  const [noneOfThese, setNoneOfThese] = useState(false)
  const [showFix, setShowFix] = useState(false)
  const [address, setAddress] = useState('')
  const [snapshot, setSnapshot] = useState<ReviewSnapshot | null>(null)
  const [undoUntil, setUndoUntil] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const current = list[index]
  useEffect(() => {
    setAddress(current?.addressRaw ?? '')
    setNoneOfThese(false)
    setShowFix(false)
  }, [current?.id, current?.addressRaw])

  useEffect(() => {
    if (!snapshot || undoUntil <= Date.now()) return
    const timer = window.setTimeout(() => {
      setSnapshot(null)
      setUndoUntil(0)
    }, undoUntil - Date.now())
    return () => window.clearTimeout(timer)
  }, [snapshot, undoUntil])

  if (!current) {
    return <DoneState leftOutCount={leftOut} mode={mode} />
  }

  const showCards = current.candidates.length > 0 && !noneOfThese
  const showNoParcel = current.candidates.length === 0 || noneOfThese

  function applyResult(
    result: Awaited<ReturnType<typeof chooseReviewCandidateAction>>,
    kind: 'choose' | 'leave' | 'fix' | 'undo',
  ) {
    if (result.error) {
      setError(result.error)
      return
    }
    setError(null)
    if (kind === 'undo') {
      if (result.item) {
        const restored = result.item
        setList((rows) => {
          const next = rows.some((row) => row.id === restored.id)
            ? rows.map((row) => (row.id === restored.id ? restored : row))
            : [...rows, restored].sort((left, right) =>
                left.name === right.name
                  ? left.id.localeCompare(right.id)
                  : left.name.localeCompare(right.name),
              )
          setIndex(Math.max(next.findIndex((row) => row.id === restored.id), 0))
          return next
        })
        if (restored.status === 'no_parcel' && restored.reviewState === 'pending') {
          setLeftOut((n) => Math.max(0, n - 1))
        }
      }
      setSnapshot(null)
      setUndoUntil(0)
      return
    }
    if (result.snapshot) {
      setSnapshot(result.snapshot)
      setUndoUntil(Date.now() + UNDO_MS)
    }
    if (kind === 'leave') setLeftOut((n) => n + 1)
    if (result.item) {
      setList((rows) => rows.map((row) => (row.id === result.item?.id ? result.item! : row)))
      return
    }
    setList((rows) => rows.filter((row) => row.id !== current.id))
  }

  function run(kind: 'choose' | 'leave' | 'fix' | 'undo', form: FormData) {
    startTransition(async () => {
      const action =
        kind === 'choose'
          ? chooseReviewCandidateAction
          : kind === 'leave'
            ? leaveOutReviewContactAction
            : kind === 'fix'
              ? fixReviewAddressAction
              : undoReviewDecisionAction
      applyResult(await action(form), kind)
    })
  }

  function onUndo() {
    if (!snapshot) return
    const form = new FormData()
    form.set('snapshot', JSON.stringify(snapshot))
    run('undo', form)
  }

  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">
        {reviewHeader(index + 1, list.length)}
      </h1>
      <section className="mt-6 max-w-3xl text-[15px]">
        <p className="font-medium">{REVIEW_YOU_GAVE_US}</p>
        <p className="mt-2">{current.name}</p>
        <p>{current.addressRaw}</p>
      </section>
      {showCards ? (
        <CandidateCards
          cards={current.candidates}
          disabled={pending || readOnly}
          onChoose={(parcelId) => {
            const form = new FormData()
            form.set('contactId', current.id)
            form.set('parcelId', parcelId)
            run('choose', form)
          }}
        />
      ) : null}
      {showCards ? (
        <p className="mt-6">
          <button
            className="text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            type="button"
            disabled={pending || readOnly}
            onClick={() => setNoneOfThese(true)}
          >
            {REVIEW_NONE_OF_THESE}
          </button>
        </p>
      ) : null}
      {showNoParcel ? (
        <NoParcelPanel
          address={address}
          showFix={showFix}
          disabled={pending || readOnly}
          onAddressChange={setAddress}
          onToggleFix={() => setShowFix(true)}
          onSaveAddress={() => {
            const form = new FormData()
            form.set('contactId', current.id)
            form.set('address', address)
            run('fix', form)
          }}
          onLeaveOut={() => {
            const form = new FormData()
            form.set('contactId', current.id)
            run('leave', form)
          }}
        />
      ) : null}
      {readOnly ? <p className={`mt-6 ${mutedClass}`}>{VIEW_AS_READ_ONLY}</p> : null}
      {error ? (
        <p className="mt-6 text-[15px]" role="alert">
          {error}
        </p>
      ) : null}
      {snapshot && undoUntil > Date.now() ? (
        <p className="sticky bottom-0 mt-8 bg-background py-3">
          <button
            className={buttonClass}
            type="button"
            disabled={pending || readOnly}
            onClick={onUndo}
          >
            {REVIEW_UNDO}
          </button>
        </p>
      ) : null}
    </main>
  )
}
