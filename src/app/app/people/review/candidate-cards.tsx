import { NAME_MATCH_TAG_CLASS } from '@/app/app/people/status-tag'
import { buttonClass, mutedClass } from '@/app/app/people/ui'
import type { ReviewCandidateCard } from '@/db/review-types'
import { REVIEW_NAME_MATCHES, REVIEW_RECORDED_OWNER, REVIEW_THIS_ONE } from '@/people/review-copy'
import { formatHouseFacts } from '@/people/review-state'

export function CandidateCards({
  cards,
  disabled,
  onChoose,
}: {
  cards: ReviewCandidateCard[]
  disabled: boolean
  onChoose: (parcelId: string) => void
}) {
  return (
    <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const facts = formatHouseFacts(card)
        return (
          <li
            key={card.parcelId}
            onClick={() => onChoose(card.parcelId)}
            className="rounded-md border border-border p-4 text-[15px]"
          >
            <p className="font-medium">
              {card.street}
              <br />
              {card.city}, {card.zip}
            </p>
            {card.recordedOwner ? (
              <p className="mt-3">
                {REVIEW_RECORDED_OWNER}: {card.recordedOwner}
              </p>
            ) : null}
            {card.nameMatches ? (
              <p className="mt-2">
                <span className={NAME_MATCH_TAG_CLASS}>{REVIEW_NAME_MATCHES}</span>
              </p>
            ) : null}
            {facts ? <p className={`mt-3 ${mutedClass}`}>{facts}</p> : null}
            <p className="mt-3">{card.reason}</p>
            <button
              className={`${buttonClass} mt-4 w-full md:w-auto`}
              type="button"
              disabled={disabled}
              onClick={() => onChoose(card.parcelId)}
            >
              {REVIEW_THIS_ONE}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
