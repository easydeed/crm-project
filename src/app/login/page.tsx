import Link from 'next/link'
import { LoginForm } from '@/app/login/login-form'
import { linkClass } from '@/app/app/people/ui'
import { safeReturnTo } from '@/auth/session'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const params = await searchParams
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <p className="text-[15px] font-semibold tracking-tight">onrecord</p>
        <LoginForm returnTo={safeReturnTo(params.returnTo)} />
        <Link
          className={linkClass}
          href="/register"
        >
          Create an account
        </Link>
      </div>
    </main>
  )
}
