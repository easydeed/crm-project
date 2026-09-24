'use client'

import { useActionState, useEffect } from 'react'
import {
  addToGroupAction,
  deleteSelectedAction,
  removeFromGroupAction,
  type BulkContactState,
  type GroupFormState,
} from '@/app/app/people/actions'
import { buttonClass, fieldClass } from '@/app/app/people/ui'
import type { GroupListRow } from '@/db/groups'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'

export function PeopleBulkBar({
  selected,
  groups,
  names,
  readOnly,
  onExport,
  onCleared,
}: {
  selected: string[]
  groups: GroupListRow[]
  names: string[]
  readOnly: boolean
  onExport: () => void
  onCleared: () => void
}) {
  const [addState, addAction, addPending] = useActionState(addToGroupAction, {} as GroupFormState)
  const [removeState, removeAction, removePending] = useActionState(
    removeFromGroupAction,
    {} as GroupFormState,
  )
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteSelectedAction,
    {} as BulkContactState,
  )

  useEffect(() => {
    if (addState.savedAt || removeState.savedAt || deleteState.savedAt) onCleared()
  }, [addState.savedAt, removeState.savedAt, deleteState.savedAt, onCleared])

  if (!selected.length) return null

  const error = addState.error || removeState.error || deleteState.error
  const pending = addPending || removePending || deletePending

  return (
    <div className="sticky bottom-0 z-10 mt-6 border-t border-foreground/20 bg-background py-3">
      <p className="text-[15px]">
        {selected.length === 1 ? '1 person selected' : `${selected.length} people selected`}
      </p>
      {readOnly ? <p className="mt-2 text-[15px]">{VIEW_AS_READ_ONLY}</p> : null}
      {error ? (
        <p className="mt-2 text-[15px]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <form action={addAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          {selected.map((id) => (
            <input key={`add-${id}`} type="hidden" name="contactId" value={id} />
          ))}
          <label className="text-[15px]">
            Add to group
            <select className={fieldClass} name="groupId" required disabled={readOnly || !groups.length}>
              <option value="">{groups.length ? 'Pick a group' : 'Make a group first'}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <button className={buttonClass} type="submit" disabled={readOnly || pending || !groups.length}>
            Add to group
          </button>
        </form>
        <form action={removeAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          {selected.map((id) => (
            <input key={`rm-${id}`} type="hidden" name="contactId" value={id} />
          ))}
          <label className="text-[15px]">
            Remove from group
            <select className={fieldClass} name="groupId" required disabled={readOnly || !groups.length}>
              <option value="">{groups.length ? 'Pick a group' : 'Make a group first'}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <button className={buttonClass} type="submit" disabled={readOnly || pending || !groups.length}>
            Remove from group
          </button>
        </form>
        <button className={buttonClass} type="button" onClick={onExport}>
          Export
        </button>
        <form
          action={deleteAction}
          onSubmit={(event) => {
            const label =
              names.length === 1
                ? `Delete ${names[0]}? They'll stop getting the monthly note. If you import them again later, they'll come back.`
                : `Delete ${names.length} people? They'll stop getting the monthly note. If you import them again later, they'll come back.`
            if (!window.confirm(label)) event.preventDefault()
          }}
        >
          {selected.map((id) => (
            <input key={`del-${id}`} type="hidden" name="contactId" value={id} />
          ))}
          <button className={buttonClass} type="submit" disabled={readOnly || pending}>
            Delete
          </button>
        </form>
      </div>
    </div>
  )
}
