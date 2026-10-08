'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addToGroupAction, createGroupAction, type GroupFormState } from '@/app/app/people/actions'
import { buttonClass, fieldClass, linkClass, mutedClass, panelBodyClass, panelClass, panelHeaderClass } from '@/app/app/people/ui'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'
import type { GroupListRow } from '@/db/groups'

export function AddToGroup({
  contactId,
  groups,
  readOnly,
}: {
  contactId: string
  groups: GroupListRow[]
  readOnly: boolean
}) {
  const router = useRouter()
  const [addState, addAction, addPending] = useActionState(addToGroupAction, {} as GroupFormState)
  const [createState, createAction, createPending] = useActionState(
    createGroupAction,
    {} as GroupFormState,
  )

  useEffect(() => {
    if (addState.savedAt || createState.savedAt) router.refresh()
  }, [addState.savedAt, createState.savedAt, router])

  const error = addState.error || createState.error
  const pending = addPending || createPending

  return (
    <section className={panelClass} aria-labelledby="add-group-heading">
      <h2 id="add-group-heading" className={panelHeaderClass}>
        Add to group
      </h2>
      <div className={panelBodyClass}>
      {readOnly ? <p className="mb-3 text-[15px]">{VIEW_AS_READ_ONLY}</p> : null}
      {error ? (
        <p className="mb-3 text-[15px]" role="alert">
          {error}
        </p>
      ) : null}
      {groups.length === 0 ? (
        <>
          <p className={mutedClass}>
            Groups are optional. Make one if you want to sort people.
          </p>
          <form action={createAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="contactId" value={contactId} />
            <label className="text-[15px]">
              Group name
              <input className={fieldClass} name="name" required disabled={readOnly || pending} />
            </label>
            <button className={buttonClass} type="submit" disabled={readOnly || pending}>
              New group
            </button>
          </form>
        </>
      ) : (
        <form action={addAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input type="hidden" name="contactId" value={contactId} />
          <label className="text-[15px]">
            Group
            <select className={fieldClass} name="groupId" required disabled={readOnly || pending}>
              <option value="">Pick a group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <button className={buttonClass} type="submit" disabled={readOnly || pending}>
            Add to group
          </button>
        </form>
      )}
      <p className="mt-4">
        <Link className={`tap ${linkClass}`} href="/app/people">
          Manage groups
        </Link>
      </p>
      </div>
    </section>
  )
}
