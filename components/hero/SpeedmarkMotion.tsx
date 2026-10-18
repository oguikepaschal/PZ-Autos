'use client'

import { useEffect, useRef, type ReactNode } from 'react'

// All the hero motion is CSS. This does one job: set data-paused while the
// hero is offscreen or the tab is hidden, which the module's CSS turns into
// animation-play-state: paused. Nothing re-renders; a paused animation keeps
// its position, so resuming continues without a jump.
export function SpeedmarkMotion({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let inView = true
    let tabVisible = !document.hidden
    const apply = () => {
      el.dataset.paused = String(!(inView && tabVisible))
    }

    const observer = new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1]!.isIntersecting
      apply()
    })
    observer.observe(el)

    const onVisibility = () => {
      tabVisible = !document.hidden
      apply()
    }
    document.addEventListener('visibilitychange', onVisibility)
    apply()

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div ref={ref} className={className} aria-hidden="true">
      {children}
    </div>
  )
}
