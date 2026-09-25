'use client'

/** The only part of a row that looks different when on. Says On or Off in words, not just position. */
export function AddonSwitch({
  checked,
  disabled,
  label,
  onToggle,
}: {
  checked: boolean
  disabled: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className="flex items-center gap-3 rounded-md px-1 py-1 text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed"
      disabled={disabled}
      onClick={onToggle}
      role="switch"
      type="button"
    >
      <span
        aria-hidden="true"
        className={`relative inline-block h-7 w-12 rounded-full border-2 border-foreground ${checked ? 'bg-foreground' : 'bg-background'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full motion-safe:transition-[left] ${checked ? 'left-[22px] bg-background' : 'left-0.5 bg-foreground'}`}
        />
      </span>
      <span>{checked ? 'On' : 'Off'}</span>
    </button>
  )
}
