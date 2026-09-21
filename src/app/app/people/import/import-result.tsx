import Link from 'next/link'
import type { ImportSummary } from '@/import/types'

const linkClass =
  'inline-block text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

export function ImportResultView({ result }: { result: ImportSummary }) {
  return (
    <section className="mt-8 max-w-xl" aria-live="polite">
      <h2 className="text-[18px] font-semibold">
        {result.added === 1 ? '1 person is in.' : `${result.added} people are in.`}
      </h2>
      <ul className="mt-4 flex flex-col gap-2 text-[15px]">
        <li>{result.matched} on the map</li>
        <li>{result.needsReview} need a look</li>
        <li>{result.noParcel} have no house on the record</li>
      </ul>
      {result.skipped.length > 0 ? (
        <details className="mt-6 text-[15px]">
          <summary className="cursor-pointer underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            See why {result.skipped.length === 1 ? '1 was skipped' : `${result.skipped.length} were skipped`}
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {result.skipped.map((row) => (
              <li key={`${row.line}-${row.reason}`}>
                Line {row.line}
                {row.name ? ` · ${row.name}` : ''} — {row.reason}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <p className="mt-8 flex flex-col gap-3">
        {result.needsReview > 0 ? (
          <Link className={linkClass} href="/app/people/review">
            Review them
          </Link>
        ) : null}
        <Link className={linkClass} href="/app/people">
          Go to your people
        </Link>
      </p>
    </section>
  )
}
