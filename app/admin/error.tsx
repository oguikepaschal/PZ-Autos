'use client'

// Catches a failed read on an admin page so the shell, header and tab bar
// stay up. The message is generic on purpose: the real error is in the
// server log.
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:p-0">
      <h1 className="font-display font-extrabold text-2xl text-ink mb-2">Something went wrong</h1>
      <p className="font-body text-sm text-text-muted mb-5">This page couldn&apos;t load. Try again.</p>
      <button
        type="button"
        onClick={reset}
        className="min-h-11 rounded-full bg-ink px-4 font-body text-[15px] font-semibold text-ink-inverse"
      >
        Try again
      </button>
    </div>
  )
}
