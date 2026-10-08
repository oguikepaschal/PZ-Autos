'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

const ADVANCE_MS = 3800
const TOUCH_HOLD_MS = 6000
// Up to this many cars get dots; past it a "3 / 24" counter takes their
// place. Six 44px dots plus the 44px pause button is the most that fits a
// 360px phone inside the page gutters.
const MAX_DOTS = 6

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const PHONE = '(max-width: 47.99rem)'

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

interface CarRailProps {
  // One accessible label per card, in order, for the dot buttons.
  labels: string[]
  // /cars only: advance on its own below md. The landing page leaves it off.
  autoAdvance?: boolean
  children: React.ReactNode
}

// Below md the cards sit in one native scroll-snap row with the next card
// peeking; from md up the same list is a grid. With autoAdvance the row moves
// one card every 3.8s, and holds while it's touched (and for 6s after), while
// hovered or focused, while the tab is hidden, or when paused. Reduced motion
// starts it paused; the pause button is always there to stop or resume it.
export function CarRail({ labels, autoAdvance = false, children }: CarRailProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const hold = useRef({ hover: false, focus: false, touching: false, lastTouch: 0 })
  const [index, setIndex] = useState(0)
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  )
  // null until the visitor presses the button; until then reduced motion
  // decides.
  const [userPaused, setUserPaused] = useState<boolean | null>(null)
  const paused = userPaused ?? reduceMotion

  const goTo = useCallback(
    (next: number) => {
      const list = listRef.current
      const card = list?.children[next] as HTMLElement | undefined
      if (!list || !card) return
      const padding = parseFloat(getComputedStyle(list).scrollPaddingLeft) || 0
      list.scrollTo({ left: card.offsetLeft - padding, behavior: reduceMotion ? 'auto' : 'smooth' })
    },
    [reduceMotion]
  )

  useEffect(() => {
    if (!autoAdvance || paused) return
    const phone = window.matchMedia(PHONE)
    const timer = window.setInterval(() => {
      const list = listRef.current
      const h = hold.current
      if (!list || !phone.matches || document.hidden) return
      if (h.hover || h.focus || h.touching || Date.now() - h.lastTouch < TOUCH_HOLD_MS) return
      const atEnd = list.scrollLeft >= list.scrollWidth - list.clientWidth - 2
      goTo(atEnd ? 0 : index + 1)
    }, ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [autoAdvance, paused, index, goTo])

  const frame = useRef(0)
  function handleScroll() {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const list = listRef.current
      if (!list) return
      const cards = Array.from(list.children) as HTMLElement[]
      const padding = parseFloat(getComputedStyle(list).scrollPaddingLeft) || 0
      let nearest = 0
      cards.forEach((card, i) => {
        const distance = Math.abs(card.offsetLeft - padding - list.scrollLeft)
        if (distance < Math.abs(cards[nearest]!.offsetLeft - padding - list.scrollLeft)) nearest = i
      })
      setIndex(nearest)
    })
  }

  function touched() {
    hold.current.lastTouch = Date.now()
  }

  const count = labels.length
  const showControls = autoAdvance && count > 1

  return (
    <div
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') hold.current.hover = true
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') hold.current.hover = false
      }}
      // Keyboard focus only: a tap focuses a button on Android too, and that
      // must not stop the row for good.
      onFocus={(e) => {
        hold.current.focus = e.target.matches(':focus-visible')
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hold.current.focus = false
      }}
    >
      <ul
        ref={listRef}
        aria-label="Cars"
        onScroll={handleScroll}
        onTouchStart={() => {
          hold.current.touching = true
          touched()
        }}
        onTouchEnd={() => {
          hold.current.touching = false
          touched()
        }}
        onTouchCancel={() => {
          hold.current.touching = false
          touched()
        }}
        onPointerDown={touched}
        onWheel={touched}
        className="relative -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3.5 overflow-x-auto overscroll-x-contain px-5 py-1 scrollbar-hide md:mx-0 md:grid md:snap-none md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:py-0 lg:grid-cols-3"
      >
        {children}
      </ul>

      {showControls && (
        <div className="mt-1 flex items-center justify-center md:hidden">
          {count <= MAX_DOTS ? (
            <div role="group" aria-label="Choose a car" className="flex items-center">
              {labels.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show ${label}`}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => {
                    touched()
                    goTo(i)
                  }}
                  className="flex size-11 items-center justify-center"
                >
                  <span
                    className={cn(
                      'block h-1.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none',
                      i === index ? 'w-[22px] bg-ink' : 'w-1.5 bg-ink-3'
                    )}
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 font-body text-[15px] font-semibold text-text-muted tabular-nums">
              {index + 1} / {count}
            </p>
          )}
          <button
            type="button"
            onClick={() => setUserPaused(!paused)}
            aria-label={paused ? 'Play auto-advance' : 'Pause auto-advance'}
            className="glass ml-1 flex size-11 items-center justify-center rounded-full text-ink"
          >
            {paused ? (
              <Play size={16} strokeWidth={2} aria-hidden="true" className="fill-current" />
            ) : (
              <Pause size={16} strokeWidth={2} aria-hidden="true" className="fill-current" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}
