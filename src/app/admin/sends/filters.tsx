export function SendFilters({
  accountId,
  state,
  accounts,
  states,
}: {
  accountId?: string
  state?: string
  accounts: { id: string; name: string }[]
  states: string[]
}) {
  return (
    <form className="mt-8 flex flex-wrap items-end gap-4" method="get">
      <label className="text-[15px]">
        Account
        <select
          className="mt-1 block rounded-md border border-foreground/20 bg-background px-3 py-2 text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          defaultValue={accountId ?? ''}
          name="account"
        >
          <option value="">All accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-[15px]">
        State
        <select
          className="mt-1 block rounded-md border border-foreground/20 bg-background px-3 py-2 text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          defaultValue={state ?? ''}
          name="state"
        >
          <option value="">All states</option>
          {states.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <button
        className="rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        type="submit"
      >
        Filter
      </button>
    </form>
  )
}
