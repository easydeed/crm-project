import Link from 'next/link'
import { RegisterForm } from '@/app/register/register-form'
import { AuthBar } from '@/app/auth-bar'
import { linkClass, panelClass } from '@/app/app/people/ui'

export default function RegisterPage() {
  return (
    <>
    <AuthBar />
    {/* Top-aligned, as drawn: the form is long enough that centring it would push it off a phone. */}
    <main className="flex justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <h1 className="text-center text-[24px] font-semibold tracking-[-0.01em]">Create your account</h1>
        <section aria-label="Create your account" className={`w-full ${panelClass}`}>
          <RegisterForm />
        </section>
        <Link
          className={`tap ${linkClass}`}
          href="/login"
        >
          Sign in
        </Link>
      </div>
    </main>
    </>
  )
}
