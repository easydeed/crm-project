import { exitViewAsAction } from '@/app/admin/actions'
import { INK_COLOR } from '@/config/settings'

export function ViewAsBanner({ name }: { name: string }) {
  return (
    <div
      className="fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 text-[15px] text-white"
      style={{ backgroundColor: INK_COLOR }}
    >
      <p>Viewing as {name} — read only</p>
      <form action={exitViewAsAction}>
        <button
          className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          type="submit"
        >
          Exit
        </button>
      </form>
    </div>
  )
}
