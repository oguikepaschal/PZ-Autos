'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle } from 'lucide-react'
import { WordmarkBadge } from '@/components/theme/Logo'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('Incorrect email or password.')
      setSubmitting(false)
      return
    }

    router.push(searchParams.get('redirectTo') || '/admin')
    router.refresh()
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <WordmarkBadge priority />
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-surface p-6 space-y-4"
        >
          <div>
            <label className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 rounded-xl bg-fill px-3 py-2 font-body text-ink outline-offset-1"
            />
          </div>
          <div>
            <label className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 rounded-xl bg-fill px-3 py-2 font-body text-ink outline-offset-1"
            />
          </div>
          {error && (
            <p role="alert" className="flex items-center gap-2 font-body text-sm font-semibold text-ink">
              <AlertCircle size={18} aria-hidden="true" className="shrink-0 text-signal-red" />
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-11 rounded-full bg-ink text-ink-inverse font-body font-semibold text-base py-3 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
