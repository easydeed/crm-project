import Link from 'next/link'
import { RegisterForm } from '@/app/register/register-form'

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <p className="text-[15px] font-semibold tracking-tight">onrecord</p>
        <RegisterForm />
        <Link
          className="text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/login"
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}
