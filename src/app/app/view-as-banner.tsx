import { exitViewAsAction } from '@/app/admin/actions'
import { linkBaseClass } from '@/app/app/people/ui'
import { INK_COLOR } from '@/config/settings'

/**
 * The view-as banner (OR-043): coral with navy words, on the alert pair, so it can never merge with
 * the navy bar below it. Sticky, in the flow of the page: it takes its own height at every width,
 * where a fixed banner needed the page padded to a height that was wrong on a phone.
 */
export function ViewAsBanner({ name }: { name: string }) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-2 text-[15px] font-semibold text-on-alert" style={{ backgroundColor: INK_COLOR }}>
      <p>Viewing as {name} — read only</p>
      <form action={exitViewAsAction}>
        <button className={`${linkBaseClass} min-h-11 text-on-alert`} type="submit">
          Exit
        </button>
      </form>
    </div>
  )
}
