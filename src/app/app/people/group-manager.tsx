'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  createGroupAction,
  deleteGroupAction,
  renameGroupAction,
  type GroupFormState,
} from '@/app/app/people/actions'
import { buttonClass, fieldClass, linkClass } from '@/app/app/people/ui'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'
import type { GroupListRow } from '@/db/groups'

export function GroupManager({
  groups,
  readOnly,
  onSaved,
}: {
  groups: GroupListRow[]
  readOnly: boolean
  onSaved: () => void
}) {
  const [creating, setCreating] = useState(false)
  const [createState, createAction, createPending] = useActionState(
    createGroupAction,
    {} as GroupFormState,
  )
  const [renameState, renameAction, renamePending] = useActionState(
    renameGroupAction,
    {} as GroupFormState,
  )
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteGroupAction,
    {} as GroupFormState,
  )

  useEffect(() => {
    if (createState.savedAt) setCreating(false)
    if (createState.savedAt || renameState.savedAt || deleteState.savedAt) onSaved()
  }, [createState.savedAt, renameState.savedAt, deleteState.savedAt, onSaved])

  const error = createState.error || renameState.error || deleteState.error
  const pending = createPending || renamePending || deletePending

  return (
    <section className="mt-10 max-w-xl" aria-labelledby="groups-heading">
      <h2 id="groups-heading" className="text-[18px] font-semibold">
        Groups
      </h2>
      {groups.length === 0 ? (
        <p className="mt-3 text-[15px] text-foreground/80">
          Groups are optional. Make one if you want to sort people.{' '}
          <button className={linkClass} type="button" onClick={() => setCreating(true)}>
            New group
          </button>
        </p>
      ) : (
        <p className="mt-3">
          <button className={linkClass} type="button" onClick={() => setCreating(true)}>
            New group
          </button>
        </p>
      )}
      {readOnly ? <p className="mt-3 text-[15px]">{VIEW_AS_READ_ONLY}</p> : null}
      {error ? (
        <p className="mt-3 text-[15px]" role="alert">
          {error}
        </p>
      ) : null}
      {creating ? (
        <form action={createAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="text-[15px]">
            Group name
            <input className={fieldClass} name="name" required disabled={readOnly || pending} />
          </label>
          <button className={buttonClass} type="submit" disabled={readOnly || pending}>
            Save group
          </button>
        </form>
      ) : null}
      <ul className="mt-4 flex flex-col gap-4">
        {groups.map((group) => (
          <li key={group.id} className="text-[15px]">
            <p className="font-medium">
              {group.name} ({group.count})
            </p>
            <form action={renameAction} className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
              <input type="hidden" name="groupId" value={group.id} />
              <label>
                Rename
                <input
                  className={fieldClass}
                  name="name"
                  defaultValue={group.name}
                  required
                  disabled={readOnly || pending}
                />
              </label>
              <button className={buttonClass} type="submit" disabled={readOnly || pending}>
                Rename
              </button>
            </form>
            <form
              action={deleteAction}
              className="mt-2"
              onSubmit={(event) => {
                if (
                  !window.confirm(
                    `Remove the group "${group.name}"? People stay on your list.`,
                  )
                ) {
                  event.preventDefault()
                }
              }}
            >
              <input type="hidden" name="groupId" value={group.id} />
              <button className={linkClass} type="submit" disabled={readOnly || pending}>
                Delete group
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  )
}
