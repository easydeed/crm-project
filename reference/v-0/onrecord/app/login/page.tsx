'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/auth-shell'
import { RecordArtifact } from '@/components/auth/record-artifact'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('dana@coastlinerealty.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    // Mock auth: the demo password is "onrecord".
    if (password !== 'onrecord') {
      setError(
        'That password doesn\u2019t match. For this demo, use \u201Conrecord\u201D.',
      )
      return
    }
    setLoading(true)
    setTimeout(() => router.push('/app'), 500)
  }

  return (
    <AuthShell
      artifact={<RecordArtifact />}
      footer={
        <p className="mt-6 text-center text-[14px] text-muted-foreground">
          New here?{' '}
          <Link
            href="/register"
            className="font-[560] text-blue hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      {/* Setup complete — a returning user is already through the three steps */}
      <div className="flex items-center gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full bg-blue" />
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        Welcome back
      </p>

      <div className="mt-4">
        <h1 className="font-serif text-[30px] leading-[1.1] tracking-[-0.01em] text-ink text-balance">
          Sign in to your desk
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground text-pretty">
          Your sphere, your farm, and every record — right where you left them.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <span className="text-[12px] text-muted-foreground">
              Demo: <span className="font-mono text-ink">onrecord</span>
            </span>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error}
            required
            className="h-11"
          />
          {error && (
            <p className="text-[13px] font-[560] text-coral" role="alert">
              {error}
            </p>
          )}
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="mt-1 h-12 bg-blue text-[15px] font-[620] text-white transition-transform hover:bg-blue/90 active:scale-[0.99]"
        >
          {loading ? 'Signing in\u2026' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  )
}
