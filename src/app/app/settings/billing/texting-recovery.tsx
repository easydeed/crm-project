import { PlanButton } from '@/app/app/settings/billing/plan-button'
import { retryTextingStopAction } from '@/app/app/settings/billing/actions'
import { inlineLinkClass, panelBodyClass, panelClass } from '@/app/app/people/ui'
import { SUPPORT_EMAIL, supportMailto } from '@/config/support'

export function TextingRecovery({ state, accountId, readOnly }: { state: 'pending' | 'failed' | null; accountId: string; readOnly: boolean }) {
  if (!state) return null
  return <section id="texting-recovery" role="status" className={`${panelClass} ${panelBodyClass}`}>
    <h2 className="text-[17px] font-semibold">Texting switch-off {state === 'pending' ? 'pending' : 'needs attention'}</h2>
    <p className="mt-2 max-w-xl text-[15px]">Texts are paused. The paid add-on may still be billed until the switch-off is confirmed.</p>
    <p className="mt-2 max-w-xl text-[15px]">{state === 'pending' ? 'We are retrying automatically. Refresh this page to check progress.' : 'Automatic retries have stopped. Retry below, or contact support if it keeps failing.'}</p>
    {!readOnly && state === 'failed' ? <form className="mt-4" action={retryTextingStopAction}><PlanButton label="Retry texting switch-off" /></form> : null}
    <p className="mt-3 text-[15px]">Need help? <a className={inlineLinkClass} href={supportMailto(`Texting billing switch-off - ${accountId}`)}>{SUPPORT_EMAIL}</a></p>
  </section>
}
