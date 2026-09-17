import { viewAsAction } from '@/app/admin/actions'

export function ViewAsButton({ accountId }: { accountId: string }) {
  return (
    <form action={viewAsAction} className="mt-6">
      <input type="hidden" name="accountId" value={accountId} />
      <button
        className="rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        type="submit"
      >
        View as this agent
      </button>
    </form>
  )
}
