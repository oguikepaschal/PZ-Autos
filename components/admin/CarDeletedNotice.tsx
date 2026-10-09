'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

const EVENT = 'pz:car-deleted'
const VISIBLE_MS = 2000

// The deleted car's row (and the button that deleted it) is gone by the time
// the list refreshes, so the confirmation can't live there. The notice is
// mounted once in the admin layout and any delete announces to it.
export function announceCarDeleted() {
  window.dispatchEvent(new Event(EVENT))
}

// Visible on phones; from md up it is only announced to screen readers.
export function CarDeletedNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let timer: number | undefined
    function show() {
      setVisible(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setVisible(false), VISIBLE_MS)
    }
    window.addEventListener(EVENT, show)
    return () => {
      window.removeEventListener(EVENT, show)
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+12px)] z-50 flex justify-center md:sr-only"
    >
      {visible && (
        <span className="glass inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-body text-[15px] font-semibold text-ink">
          <Check size={16} strokeWidth={2.4} aria-hidden="true" />
          Car deleted
        </span>
      )}
    </div>
  )
}
