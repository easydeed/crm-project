import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { readRequestSession } from '@/auth/current-session'
import { assertWritable } from '@/auth/write-guard'
import { completeDemoCheckout, readDemoCheckout } from '@/billing/demo-checkout'
import { formatDollars } from '@/config/costs'
import { buttonClass, linkClass, panelClass, panelBodyClass } from '@/app/app/people/ui'

async function confirm(form: FormData) {
  'use server'
  const session = await readRequestSession()
  if (!session || !assertWritable(session).ok) redirect('/login')
  const path = await completeDemoCheckout(String(form.get('token') ?? ''), session.accountId)
  revalidatePath('/app/settings/billing')
  revalidatePath('/app')
  redirect(path)
}

export default async function DemoCheckoutPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const session = await readRequestSession()
  if (!session) redirect('/login')
  if (!assertWritable(session).ok) notFound()
  const { token = '' } = await searchParams
  const checkout = readDemoCheckout(token, session.accountId)
  return <main className="px-4 py-10">
    <section className={`max-w-xl ${panelClass} ${panelBodyClass}`}>
      <h1 className="text-[22px] font-semibold">Demo checkout</h1>
      {checkout ? <>
        <p className="mt-3 text-[17px]">Test plan: {formatDollars(checkout.monthlyCents)} a month. No payment is collected.</p>
        <form action={confirm} className="mt-5">
          <input type="hidden" name="token" value={token} />
          <button className={buttonClass} type="submit">Activate demo plan</button>
        </form>
      </> : <p className="mt-3 text-[17px]">This checkout expired. Start again from Billing.</p>}
      <Link className={`tap mt-4 inline-block ${linkClass}`} href="/app/settings/billing">Back to billing</Link>
    </section>
  </main>
}
