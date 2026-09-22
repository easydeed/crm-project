'use client'

import { useId, useState } from 'react'
import type { DigestResult } from '@/digest/types'

const toggleClass =
  'rounded-md px-3 py-2 text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

function ToggleGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className="flex flex-wrap gap-2">
      <p id={id} className="sr-only">
        {label}
      </p>
      {options.map((option) => {
        const on = option.value === value
        return (
          <button
            key={option.value}
            className={`${toggleClass} ${on ? 'bg-foreground text-background' : 'border border-foreground/20'}`}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function DigestPreviewFrame({ html, text }: { html: string; text: string }) {
  const [width, setWidth] = useState('600')
  const [mode, setMode] = useState('email')
  const size = Number(width)

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        label="Preview size"
        value={width}
        options={[
          { value: '600', label: 'Desktop' },
          { value: '380', label: 'Phone' },
        ]}
        onChange={setWidth}
      />
      <ToggleGroup
        label="Preview format"
        value={mode}
        options={[
          { value: 'email', label: 'Email' },
          { value: 'text', label: 'Plain text' },
        ]}
        onChange={setMode}
      />
      {mode === 'email' ? (
        <iframe
          title="Email preview"
          sandbox=""
          srcDoc={html}
          width={size}
          height={640}
          className="max-w-full border border-foreground/20 bg-white motion-reduce:transition-none"
          style={{ width: size }}
        />
      ) : (
        <pre
          className="max-w-full overflow-x-auto whitespace-pre-wrap border border-foreground/20 bg-white p-4 text-[15px] text-foreground"
          style={{ width: size }}
        >
          {text}
        </pre>
      )}
    </div>
  )
}

export function DigestPreviewPanel({
  title,
  result,
  sampleLabel,
}: {
  title: string
  result: DigestResult
  sampleLabel?: string
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[18px] font-semibold">{title}</h2>
      {sampleLabel ? <p className="text-[15px]">{sampleLabel}</p> : null}
      {result.send ? (
        <DigestPreviewFrame html={result.html} text={result.text} />
      ) : (
        <p className="text-[15px]">{result.reason}</p>
      )}
    </section>
  )
}
