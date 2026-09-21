'use client'

import { useActionState, useMemo, useState } from 'react'
import { importContactsAction } from '@/app/app/people/import/actions'
import { ColumnMapping } from '@/app/app/people/import/column-mapping'
import { ImportResultView } from '@/app/app/people/import/import-result'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'
import {
  applyMapping,
  detectColumns,
  looksLikeHeaderRow,
  mappingIsComplete,
} from '@/import/detect-columns'
import { parseDelimited } from '@/import/parse-csv'
import type { FieldRole, ImportState } from '@/import/types'

const fieldClass =
  'mt-2 w-full max-w-xl rounded-md border border-foreground/20 bg-background px-3 py-2 text-[15px] text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'
const tabClass =
  'px-3 py-2 text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
const buttonClass =
  'mt-6 rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-60'

export function ImportForm({ readOnly }: { readOnly?: boolean }) {
  const [state, action, pending] = useActionState(importContactsAction, {} as ImportState)
  const [tab, setTab] = useState<'file' | 'paste'>('file')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [over, setOver] = useState(false)
  const [mapping, setMapping] = useState<FieldRole[] | null>(null)

  const table = useMemo(() => parseDelimited(text), [text])
  const hasHeader = table.length > 0 && looksLikeHeaderRow(table[0])
  const headers = useMemo(() => table[0] ?? [], [table])
  const detected = useMemo(() => (headers.length ? detectColumns(headers) : null), [headers])
  const roles = mapping ?? detected?.mapping ?? []
  const ready = mappingIsComplete(roles)
  const rows = table.length ? applyMapping(table, roles, hasHeader) : []
  const needsMapping = table.length > 0 && !ready

  if (state.result) return <ImportResultView result={state.result} />

  return (
    <form action={action} className="mt-8">
      {readOnly ? <p className="mb-4 text-[15px]">{VIEW_AS_READ_ONLY}</p> : null}
      {state.error ? (
        <p className="mb-4 text-[15px]" role="alert">
          {state.error}
        </p>
      ) : null}
      <div role="tablist" aria-label="How to add people" className="flex gap-2">
        <TabButton selected={tab === 'file'} disabled={pending} onClick={() => setTab('file')}>
          Upload a file
        </TabButton>
        <TabButton selected={tab === 'paste'} disabled={pending} onClick={() => setTab('paste')}>
          Paste a list
        </TabButton>
      </div>
      {tab === 'file' ? (
        <div
          className={`mt-6 max-w-xl rounded-md border border-dashed border-foreground/30 p-6 text-[15px] ${over ? 'bg-foreground/5' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={async (event) => {
            event.preventDefault()
            setOver(false)
            const file = event.dataTransfer.files[0]
            if (!file) return
            setFileName(file.name)
            setText(await file.text())
            setMapping(null)
          }}
        >
          <p>{fileName ? fileName : 'Drop a .csv here, or choose one.'}</p>
          <input
            className={`${fieldClass} mt-4`}
            type="file"
            accept=".csv,text/csv"
            disabled={pending || readOnly}
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) return
              setFileName(file.name)
              setText(await file.text())
              setMapping(null)
            }}
          />
        </div>
      ) : (
        <label className="mt-6 block max-w-xl text-[15px]">
          One person per line, comma or tab.
          <textarea
            className={`${fieldClass} min-h-48`}
            value={text}
            disabled={pending || readOnly}
            onChange={(event) => {
              setText(event.target.value)
              setMapping(null)
            }}
          />
        </label>
      )}
      {pending ? <p className="mt-6 text-[15px]">Matching addresses…</p> : null}
      {!pending && !text.trim() ? (
        <p className="mt-6 text-[15px]">Drop a file or paste a list to start.</p>
      ) : null}
      {!pending && text.trim() ? (
        <p className="mt-6 text-[15px]">
          {rows.length === 1 ? '1 person ready to import.' : `${rows.length} people ready to import.`}
        </p>
      ) : null}
      {needsMapping ? (
        <ColumnMapping
          headers={headers}
          mapping={roles}
          onChange={(index, role) => {
            const next = [...roles]
            next[index] = role
            setMapping(next)
          }}
        />
      ) : null}
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />
      <button className={buttonClass} type="submit" disabled={pending || readOnly || !rows.length}>
        {pending ? 'Matching addresses…' : 'Import'}
      </button>
    </form>
  )
}

function TabButton({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean
  disabled: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      className={`${tabClass} ${selected ? 'font-semibold underline underline-offset-4' : ''}`}
      type="button"
      role="tab"
      aria-selected={selected}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
