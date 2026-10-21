import Link from 'next/link'
import { isLocalE2E } from '@/config/e2e'
import { RecoveryForm } from '@/app/forgot-password/recovery-form'
import { linkClass, inlineLinkClass, panelClass, panelBodyClass } from '@/app/app/people/ui'
import { SUPPORT_EMAIL, supportMailto } from '@/config/support'

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  return <main className="px-4 py-10"><section className={`mx-auto max-w-sm ${panelClass} ${panelBodyClass}`}>
    <h1 className="text-[22px] font-semibold">Reset your password</h1>
    {isLocalE2E() ? <RecoveryForm /> : <p className="mt-4 text-[17px]">Recovery email is not connected yet. Contact <a className={inlineLinkClass} href={supportMailto('Password recovery')}>{SUPPORT_EMAIL}</a> for help.</p>}
    <Link href="/login" className={`tap mt-4 inline-block ${linkClass}`}>Back to sign in</Link>
  </section></main>
}
