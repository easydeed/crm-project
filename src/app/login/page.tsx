import Link from 'next/link'
import { LoginForm } from '@/app/login/login-form'
import { AuthBar } from '@/app/auth-bar'
import { linkClass, panelClass } from '@/app/app/people/ui'
import { safeReturnTo } from '@/auth/session'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const params = await searchParams
  return (
    <div className="flex min-h-screen flex-col">
    <AuthBar />
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <h1 className="text-center text-[24px] font-semibold tracking-[-0.01em]">Sign in</h1>
        <section aria-label="Sign in" className={`w-full ${panelClass}`}>
          <LoginForm returnTo={safeReturnTo(params.returnTo)} />
        </section>
        <Link
          className={`tap ${linkClass}`}
          href="/register"
        >
          Create an account
        </Link>
      </div>
    </main>
    </div>
  )
}
