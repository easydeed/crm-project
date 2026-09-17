export function AccountsSearch({ q }: { q: string }) {
  return (
    <form className="mt-6 flex max-w-xl flex-wrap items-end gap-3" method="get">
      <label className="text-[15px]">
        Search
        <input
          className="mt-1 w-full min-w-[16rem] rounded-md border border-foreground/20 bg-background px-3 py-2 text-[15px] text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          type="search"
          name="q"
          defaultValue={q}
        />
      </label>
      <button
        className="rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        type="submit"
      >
        Search
      </button>
    </form>
  )
}
