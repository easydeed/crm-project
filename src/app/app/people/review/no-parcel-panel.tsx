import { buttonClass, fieldClass, linkClass, mutedClass } from '@/app/app/people/ui'
import {
  REVIEW_COULDNT_FIND,
  REVIEW_FIX_ADDRESS,
  REVIEW_LEAVE_OUT,
  REVIEW_LEAVE_OUT_MUTED,
  REVIEW_SAVE_ADDRESS,
} from '@/people/review-copy'

export function NoParcelPanel({
  address,
  showFix,
  disabled,
  onAddressChange,
  onToggleFix,
  onSaveAddress,
  onLeaveOut,
}: {
  address: string
  showFix: boolean
  disabled: boolean
  onAddressChange: (value: string) => void
  onToggleFix: () => void
  onSaveAddress: () => void
  onLeaveOut: () => void
}) {
  return (
    <div className="mt-6 max-w-xl text-[15px]">
      <p>{REVIEW_COULDNT_FIND}</p>
      {showFix ? (
        <label className="mt-4 block">
          Address
          <input
            className={fieldClass}
            value={address}
            onChange={(event) => onAddressChange(event.target.value)}
            disabled={disabled}
          />
          <button
            className={`${buttonClass} mt-3`}
            type="button"
            disabled={disabled}
            onClick={onSaveAddress}
          >
            {REVIEW_SAVE_ADDRESS}
          </button>
        </label>
      ) : (
        <p className="mt-4">
          <button
            className={linkClass}
            type="button"
            disabled={disabled}
            onClick={onToggleFix}
          >
            {REVIEW_FIX_ADDRESS}
          </button>
        </p>
      )}
      <p className="mt-6">
        <button
          className={buttonClass}
          type="button"
          disabled={disabled}
          onClick={onLeaveOut}
        >
          {REVIEW_LEAVE_OUT}
        </button>
      </p>
      <p className={`mt-3 ${mutedClass}`}>{REVIEW_LEAVE_OUT_MUTED}</p>
    </div>
  )
}
