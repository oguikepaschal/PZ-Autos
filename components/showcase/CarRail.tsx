'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

// Constant drift speed of the auto row.
const DRIFT_PX_PER_S = 60
// Longest frame step the drift will honour, so a stalled frame never jumps.
const MAX_FRAME_MS = 50
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

// Below md the cards sit in one native scroll row with the next card peeking;
// from md up the same list is a grid. With autoAdvance the row drifts left at
// a constant speed over a doubled card list and wraps back by one list width
// without a visible jump. It holds while it's touched (and for 6s after),
// while hovered or focused, while the tab is hidden, or when paused. Reduced
// motion starts it paused; the pause button is always there to stop or resume
// it. Without autoAdvance the row is a plain snap-scrolling swipe row.
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

  const count = labels.length

  // Scrolls to a card in the real list, or to its looped copy when that one
  // is nearer.
  const goTo = useCallback(
    (target: number) => {
      const list = listRef.current
      const card = list?.children[target] as HTMLElement | undefined
      if (!list || !card) return
      const padding = parseFloat(getComputedStyle(list).scrollPaddingLeft) || 0
      let left = card.offsetLeft - padding
      const copy = list.children[target + count] as HTMLElement | undefined
      if (copy?.offsetParent) {
        const copyLeft = copy.offsetLeft - padding
        if (Math.abs(copyLeft - list.scrollLeft) < Math.abs(left - list.scrollLeft)) left = copyLeft
      }
      list.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' })
    },
    [reduceMotion, count]
  )

  // The looped copy is for looks only: keep its links out of the tab order.
  useEffect(() => {
    if (!autoAdvance) return
    listRef.current
      ?.querySelectorAll<HTMLElement>('[data-loop-copy] a, [data-loop-copy] button')
      .forEach((el) => el.setAttribute('tabindex', '-1'))
  }, [autoAdvance, count])

  useEffect(() => {
    const list = listRef.current
    if (!autoAdvance || paused || !list) return
    const phone = window.matchMedia(PHONE)
    // The drift position lives in a float. Reading scrollLeft back each frame
    // would lose the sub-pixel part and stall a slow drift.
    let position = list.scrollLeft
    let synced = true
    let last = performance.now()
    let loopWidth = 0
    let raf = 0

    // One list width: the distance from a card to its copy. Zero when there
    // are too few cars to fill the row, which turns the drift off.
    const measure = () => {
      const copy = list.children[count] as HTMLElement | undefined
      const first = list.children[0] as HTMLElement | undefined
      const width = copy && first ? copy.offsetLeft - first.offsetLeft : 0
      loopWidth = width > 0 && width <= list.scrollWidth - list.clientWidth ? width : 0
    }
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    measure()

    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      const dt = Math.min(now - last, MAX_FRAME_MS)
      last = now
      const h = hold.current
      const held =
        h.hover || h.focus || h.touching || Date.now() - h.lastTouch < TOUCH_HOLD_MS || document.hidden
      if (held || !phone.matches || loopWidth === 0) {
        synced = false
        return
      }
      if (!synced) {
        // Pick up from wherever the visitor left the row.
        position = list.scrollLeft
        synced = true
      }
      position += (DRIFT_PX_PER_S * dt) / 1000
      if (position >= loopWidth) position -= loopWidth
      list.scrollLeft = position
    }
    raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [autoAdvance, paused, count])

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
      setIndex(nearest % count)
    })
  }

  function touched() {
    hold.current.lastTouch = Date.now()
  }

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
        className={cn(
          'relative -mx-5 flex scroll-px-5 gap-3.5 overflow-x-auto overscroll-x-contain px-5 py-1 scrollbar-hide md:mx-0 md:grid md:snap-none md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:py-0 lg:grid-cols-3',
          // Snap fights a continuous drift, so the auto row goes without it.
          !autoAdvance && 'snap-x snap-mandatory',
          // The looped copy is for the drift only: hidden while reduced motion
          // holds the row still, shown once the visitor presses play.
          autoAdvance && reduceMotion && userPaused === null && '[&>[data-loop-copy]]:hidden'
        )}
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
