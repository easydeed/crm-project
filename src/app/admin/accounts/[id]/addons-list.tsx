import type { AddonState, UnknownAddonRow } from '@/addons/state'

const buttonClass =
  'text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

const RESULT: Record<string, string> = {
  on: 'Switched on.',
  config: "Needs the agent's settings first. Nothing changed.",
  unknown: 'That add-on is not registered. Nothing changed.',
  forbidden: 'Only an admin can do this.',
}

function configLine(config: Record<string, unknown>) {
  const entries = Object.entries(config)
  return entries.length === 0 ? 'No settings.' : entries.map(([name, value]) => `${name}: ${String(value)}`).join(' · ')
}

/**
 * This account's add-ons: what is on and with what settings, rows for keys nothing
 * registers, and a force-enable for each registered add-on that is off.
 */
export function AddonsList({
  accountId,
  states,
  unknown,
  flash,
  forceEnable,
}: {
  accountId: string
  states: AddonState[]
  unknown: UnknownAddonRow[]
  flash?: { key: string; result: string }
  forceEnable: (formData: FormData) => Promise<void>
}) {
  const on = states.filter((state) => state.enabled)
  const off = states.filter((state) => !state.enabled)

  return (
    <section className="mt-10 max-w-xl text-[15px]">
      <h2 className="text-[18px] font-semibold">Add-ons</h2>
      {flash ? (
        <p className="mt-2" role="status">
          {flash.key}: {RESULT[flash.result] ?? 'Nothing changed.'}
        </p>
      ) : null}
      {on.length === 0 ? <p className="mt-2">No add-ons are on.</p> : null}
      <ul className="mt-2 flex flex-col gap-2">
        {on.map(({ addon, config }) => (
          <li key={addon.key}>
            <span className="font-semibold">{addon.title}</span> — on. {configLine(config)}
          </li>
        ))}
        {unknown.map((row) => (
          <li key={row.key}>
            <span className="font-semibold">{row.key}</span> — Unknown add-on key — ignored.
          </li>
        ))}
      </ul>
      {off.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {off.map(({ addon }) => (
            <li key={addon.key}>
              <form action={forceEnable}>
                <input name="accountId" type="hidden" value={accountId} />
                <input name="key" type="hidden" value={addon.key} />
                <span className="mr-4">{addon.title} — off.</span>
                <button className={buttonClass} type="submit">
                  Force on
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
