import Link from 'next/link'
import { RegisterForm } from '@/app/register/register-form'
import { linkClass } from '@/app/app/people/ui'

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <p className="text-[15px] font-semibold tracking-tight">onrecord</p>
        <h1 className="text-[22px] font-semibold">Create your account</h1>
        <RegisterForm />
        <Link
          className={`tap ${linkClass}`}
          href="/login"
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}
