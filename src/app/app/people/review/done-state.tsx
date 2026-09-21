'use client'

import Link from 'next/link'
import { linkClass } from '@/app/app/people/ui'
import {
  REVIEW_ALL_ON_MAP,
  REVIEW_BACK_TO_PEOPLE,
  REVIEW_LEFT_OUT_LINK,
  REVIEW_ON_THE_MAP,
} from '@/people/review-copy'
import { reviewLeftOutDone } from '@/people/review-state'
import { peopleListHref } from '@/people/url'

export function DoneState({
  leftOutCount,
  mode,
}: {
  leftOutCount: number
  mode?: 'queue' | 'wrong-house'
}) {
  const title =
    mode === 'wrong-house'
      ? REVIEW_ON_THE_MAP
      : leftOutCount > 0
        ? reviewLeftOutDone(leftOutCount)
        : REVIEW_ALL_ON_MAP

  return (
    <main className="px-4 py-10">
      <h1 className="max-w-xl text-[22px] font-semibold">{title}</h1>
      {mode !== 'wrong-house' && leftOutCount > 0 ? (
        <p className="mt-6">
          <Link
            className={linkClass}
            href={peopleListHref({ status: 'no_parcel', leftOut: true })}
          >
            {REVIEW_LEFT_OUT_LINK}
          </Link>
        </p>
      ) : null}
      <p className="mt-6">
        <Link className={linkClass} href="/app/people">
          {REVIEW_BACK_TO_PEOPLE}
        </Link>
      </p>
    </main>
  )
}
