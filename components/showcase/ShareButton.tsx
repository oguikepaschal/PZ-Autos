'use client'

import { useEffect, useRef, useState } from 'react'
import { Share } from 'lucide-react'

// The system share sheet where there is one; otherwise the link is copied and
// a short confirmation shows.
export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch (err) {
        // Dismissing the sheet is not a failure.
        if ((err as DOMException).name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // No clipboard access either; nothing more to offer.
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleShare}
        aria-label="Share this car"
        className="glass flex size-11 items-center justify-center rounded-full text-ink"
      >
        <Share size={19} strokeWidth={1.9} aria-hidden="true" />
      </button>
      <span
        role="status"
        aria-live="polite"
        className={
          copied
            ? 'glass absolute top-full right-0 mt-2 whitespace-nowrap rounded-full px-3 py-1.5 font-body text-sm font-semibold text-ink'
            : 'sr-only'
        }
      >
        {copied ? 'Link copied' : ''}
      </span>
    </div>
  )
}
