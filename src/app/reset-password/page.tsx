import { ResetForm } from '@/app/reset-password/reset-form'
import { panelClass, panelBodyClass } from '@/app/app/people/ui'

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams
  return <main className="px-4 py-10"><section className={`mx-auto max-w-sm ${panelClass} ${panelBodyClass}`}>
    <h1 className="text-[22px] font-semibold">Choose a new password</h1>
    <ResetForm token={token} />
  </section></main>
}
