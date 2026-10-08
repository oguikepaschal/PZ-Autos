'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

// The instant saves (Mark verified, featured, position, the status actions)
// run a server action straight away and confirm it briefly, so a tap that
// changes live data never goes unacknowledged.
export function useInstantSave() {
  const router = useRouter()
  const [state, setState] = useState<SaveState>('idle')
  const [, startTransition] = useTransition()
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function run(action: () => Promise<void>, onDone?: () => void) {
    window.clearTimeout(timer.current)
    setState('saving')
    startTransition(async () => {
      try {
        await action()
        setState('saved')
        onDone?.()
        router.refresh()
        timer.current = window.setTimeout(() => setState('idle'), 2000)
      } catch {
        setState('error')
      }
    })
  }

  return { state, run, pending: state === 'saving' }
}

// Always mounted so screen readers hear the change. The error keeps ink text
// with a red icon: red text on a dark-mode card is under 4.5:1.
export function SaveStatus({ state, className }: { state: SaveState; className?: string }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-1 font-body text-[13px] font-semibold text-ink', className)}
    >
      {state === 'saved' && (
        <>
          <Check size={14} strokeWidth={2.4} aria-hidden="true" />
          Saved
        </>
      )}
      {state === 'error' && (
        <>
          <AlertCircle size={14} strokeWidth={2.2} aria-hidden="true" className="text-signal-red" />
          Not saved, try again
        </>
      )}
    </span>
  )
}
