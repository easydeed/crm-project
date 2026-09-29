'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { ImportForm } from '@/app/app/people/import/import-form'
import { buttonClass, fieldClass, linkClass, mutedClass } from '@/app/app/people/ui'
import { searchClosingsAction, type SearchState } from '@/app/app/start/actions'
import { ClosingsResults } from '@/app/app/start/closings-results'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'
import { START_COPY } from '@/signup/copy'

/** Step 2 of signup: find my closings, upload a list, or skip. In that order. */
export function StartFlow({
  agentName,
  initialAgentId,
  readOnly,
}: {
  agentName: string
  initialAgentId: string
  readOnly: boolean
}) {
  const [state, action, pending] = useActionState(searchClosingsAction, { kind: 'idle' } as SearchState)
  // Controlled: a form action resets uncontrolled fields, which would show a different id from the one searched.
  const [agentId, setAgentId] = useState(initialAgentId)
  const malformed = state.kind === 'malformed' ? state : null
  const found = state.kind === 'found' ? state : null

  return (
    <>
      {readOnly ? <p className="mt-4 text-[15px]">{VIEW_AS_READ_ONLY}</p> : null}
      <section aria-labelledby="find-heading" className="mt-8 max-w-2xl">
        <h2 id="find-heading" className="text-[18px] font-semibold">
          {START_COPY.findTitle}
        </h2>
        <form action={action} className="mt-3 flex flex-col gap-3">
          <label className="text-[15px]" htmlFor="agentId">
            {START_COPY.idLabel}
          </label>
          <input
            className={`${fieldClass} mt-0 max-w-sm`}
            id="agentId"
            name="agentId"
            autoComplete="off"
            value={agentId}
            onChange={(event) => setAgentId(event.target.value)}
            aria-invalid={malformed ? true : undefined}
            aria-describedby={malformed ? 'agentId-error agentId-where' : 'agentId-help'}
          />
          {malformed ? (
            <>
              <p id="agentId-error" className="text-[15px] font-medium" role="alert">
                {malformed.message}
              </p>
              <div id="agentId-where" className="max-w-xl rounded-md border border-foreground/20 p-4 text-[15px]">
                <p className="font-medium">{START_COPY.whereTitle}</p>
                <p className="mt-2">{START_COPY.whereBody}</p>
              </div>
            </>
          ) : (
            <p id="agentId-help" className={mutedClass}>
              {START_COPY.idHelp}
            </p>
          )}
          {state.kind === 'error' ? (
            <p className="text-[15px]" role="alert">
              {state.message}
            </p>
          ) : null}
          <div>
            <button className={`${buttonClass} max-sm:w-full`} type="submit" disabled={readOnly || pending}>
              {START_COPY.findTitle}
            </button>
          </div>
        </form>
        {pending ? <SearchingSkeleton /> : null}
        {!pending && found && found.listings.length > 0 ? (
          <ClosingsResults
            key={found.agentId}
            agentName={agentName}
            agentId={found.agentId}
            listings={found.listings}
            readOnly={readOnly}
          />
        ) : null}
        {!pending && found && found.listings.length === 0 ? (
          <p className="mt-6 max-w-xl text-[15px]" role="status">
            {START_COPY.nothing}
          </p>
        ) : null}
      </section>
      <section id="upload" aria-labelledby="upload-heading" className="mt-12 max-w-2xl">
        <h2 id="upload-heading" className="text-[18px] font-semibold">
          {START_COPY.uploadTitle}
        </h2>
        <ImportForm readOnly={readOnly} />
      </section>
      <p className="mt-12">
        <Link className={`tap ${linkClass}`} href="/app">
          {START_COPY.skip}
        </Link>
      </p>
    </>
  )
}

/** A skeleton list, not a spinner: the shape of what is coming. Static, so reduced motion needs nothing. */
function SearchingSkeleton() {
  return (
    <div className="mt-6 max-w-2xl" aria-busy="true" role="status">
      <p className="text-[15px]">{START_COPY.searching}</p>
      <ul className="mt-4 flex flex-col gap-3" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((row) => (
          <li key={row} className="h-12 rounded-md bg-foreground/10" />
        ))}
      </ul>
    </div>
  )
}
