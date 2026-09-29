import { formatAdminDate } from '@/app/admin/accounts/format'
import { describePeriodText, loadPeriodText } from '@/text/admin-text'

/** Read only. Answers a support question about the call-list text; nothing here sends. */
export async function TextSection({ accountId }: { accountId: string }) {
  const { period, row } = await loadPeriodText(accountId)
  const { state, detail } = describePeriodText(row)
  return (
    <section className="mt-10 max-w-xl text-[15px]" aria-labelledby="text-heading">
      <h2 id="text-heading" className="text-[18px] font-semibold">
        Call-list text, {period}
      </h2>
      <p className="mt-2 font-medium">{state}</p>
      {detail ? <p className="mt-1 break-words">{detail}</p> : null}
      {row ? (
        <p className="mt-1">
          To {row.toPhone} · {formatAdminDate(row.createdAt)}
        </p>
      ) : null}
    </section>
  )
}
