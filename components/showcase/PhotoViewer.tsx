'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export interface ViewerOrigin {
  rect: DOMRect
  // The photo already on screen, shown under the full-size file while it
  // loads, and its natural size for the grow animation.
  src: string
  naturalWidth: number
  naturalHeight: number
}

interface PhotoViewerProps {
  // Full-size public URLs: the largest stored version of each photo.
  images: string[]
  startIndex: number
  carName: string
  getOrigin: () => ViewerOrigin | null
  // Called as the viewer starts to close, so the page's main photo already
  // shows the last photo viewed when the viewer shrinks back onto it.
  onIndexChange: (index: number) => void
  onClosed: () => void
}

const DURATION = 300
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'
const MAX_SCALE = 4
const DOUBLE_TAP_SCALE = 2.5

type Point = { x: number; y: number }

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// The rect a photo of this aspect ratio fills when contained in the viewport.
function containedSize(naturalWidth: number, naturalHeight: number) {
  const w = window.innerWidth
  const h = window.innerHeight
  const aspect = naturalWidth / naturalHeight || 4 / 3
  return w / h > aspect ? { width: h * aspect, height: h } : { width: w, height: w / aspect }
}

// Transform that puts the contained photo exactly over `rect` (covering it,
// as the page's object-cover photo does).
function flipTransform(rect: DOMRect, naturalWidth: number, naturalHeight: number) {
  const size = containedSize(naturalWidth, naturalHeight)
  const scale = Math.max(rect.width / size.width, rect.height / size.height)
  const dx = rect.left + rect.width / 2 - window.innerWidth / 2
  const dy = rect.top + rect.height / 2 - window.innerHeight / 2
  return `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`
}

// The full-screen photo viewer. Black backdrop, each photo uncropped at its
// largest stored size (only the current one and its two neighbours load).
// Pinch and double-tap zoom, swipe sideways between photos, swipe down to
// close. It pushes a history entry on open, so the browser back button and
// Android's back gesture close it instead of leaving the page; every other
// close path goes through history.back() to consume that entry. Focus is
// trapped and the rest of the page is inert while it is open. Motion is
// 300ms on the house curve; reduced motion swaps it for a fade.
export function PhotoViewer({ images, startIndex, carName, getOrigin, onIndexChange, onClosed }: PhotoViewerProps) {
  const [index, setIndex] = useState(startIndex)
  const rootRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const indexRef = useRef(startIndex)
  const closing = useRef(false)
  const pushed = useRef(false)
  const resetAfterPage = useRef(false)
  const paging = useRef(false)
  // Read once, at the tap that opened the viewer.
  const [origin] = useState(getOrigin)

  // Gesture state, written straight to the DOM so a drag never waits on a
  // React render.
  const g = useRef({ pageX: 0, dismissY: 0, scale: 1, tx: 0, ty: 0, animate: false })
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef({
    start: { x: 0, y: 0 } as Point,
    startTime: 0,
    startTx: 0,
    startTy: 0,
    startScale: 1,
    startDist: 0,
    startMid: { x: 0, y: 0 } as Point,
    axis: null as 'x' | 'y' | null,
    pinched: false,
    last: { x: 0, y: 0, t: 0 },
    velocity: { x: 0, y: 0 },
    lastTap: { x: 0, y: 0, t: 0 },
  })

  const last = images.length - 1

  const apply = useCallback(() => {
    const s = g.current
    const transition = s.animate ? `transform ${DURATION}ms ${EASE}` : 'none'
    const h = window.innerHeight
    const dismissScale = 1 - Math.min(s.dismissY / h, 1) * 0.25
    if (trackRef.current) {
      trackRef.current.style.transition = transition
      trackRef.current.style.transform = `translate3d(${s.pageX}px, ${s.dismissY}px, 0) scale(${dismissScale})`
    }
    if (zoomRef.current) {
      zoomRef.current.style.transition = transition
      zoomRef.current.style.transform = `translate3d(${s.tx}px, ${s.ty}px, 0) scale(${s.scale})`
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = s.animate ? `opacity ${DURATION}ms ${EASE}` : 'none'
      backdropRef.current.style.opacity = String(1 - Math.min(s.dismissY / (h * 0.6), 1))
    }
  }, [])

  // The actual close: shrink back onto the page's main photo, then unmount.
  const beginClose = useCallback(() => {
    if (closing.current) return
    closing.current = true
    const current = indexRef.current
    onIndexChange(current)

    const hero = heroRef.current
    const backdrop = backdropRef.current
    const chrome = chromeRef.current
    const reduce = prefersReducedMotion()
    const s = g.current

    if (chrome) {
      chrome.style.transition = `opacity 200ms ${EASE}`
      chrome.style.opacity = '0'
    }
    if (backdrop) {
      backdrop.style.transition = `opacity ${reduce ? 200 : DURATION}ms ${EASE}`
      backdrop.style.opacity = '0'
    }
    if (!hero) {
      onClosed()
      return
    }

    if (reduce) {
      hero.style.transition = `opacity 200ms ${EASE}`
      hero.style.opacity = '0'
      window.setTimeout(onClosed, 200)
      return
    }

    // Fold the drag offset into the hero so the shrink starts where the
    // finger left the photo, then animate the hero onto the main photo.
    const dismissScale = 1 - Math.min(s.dismissY / window.innerHeight, 1) * 0.25
    hero.style.transition = 'none'
    hero.style.transform = `translate3d(0, ${s.dismissY}px, 0) scale(${dismissScale})`
    s.pageX = 0
    s.dismissY = 0
    s.scale = 1
    s.tx = 0
    s.ty = 0
    s.animate = false
    apply()
    void hero.offsetWidth

    // Where the main photo is now, sized by the photo being shown.
    const target = getOrigin()
    const img = zoomRef.current?.querySelector('img[data-full]') as HTMLImageElement | null
    const width = img?.naturalWidth || origin?.naturalWidth || 4
    const height = img?.naturalHeight || origin?.naturalHeight || 3
    hero.style.transition = `transform ${DURATION}ms ${EASE}`
    hero.style.transform = target ? flipTransform(target.rect, width, height) : 'scale(0.9)'
    if (!target) {
      hero.style.transition += `, opacity ${DURATION}ms ${EASE}`
      hero.style.opacity = '0'
    }
    window.setTimeout(onClosed, DURATION)
  }, [apply, getOrigin, onClosed, onIndexChange, origin])

  const requestClose = useCallback(() => {
    if (pushed.current && window.history.state?.pzViewer) {
      window.history.back()
    } else {
      beginClose()
    }
  }, [beginClose])

  const page = useCallback(
    (direction: 1 | -1) => {
      const next = indexRef.current + direction
      if (next < 0 || next > last || closing.current) return
      const s = g.current
      s.scale = 1
      s.tx = 0
      s.ty = 0
      if (prefersReducedMotion()) {
        indexRef.current = next
        setIndex(next)
        return
      }
      paging.current = true
      s.animate = true
      s.pageX = -direction * window.innerWidth
      apply()
      window.setTimeout(() => {
        paging.current = false
        resetAfterPage.current = true
        indexRef.current = next
        setIndex(next)
      }, DURATION)
    },
    [apply, last]
  )

  // After a page change the slides re-position around the new index; reset
  // the track offset in the same frame so nothing jumps.
  useLayoutEffect(() => {
    const s = g.current
    if (resetAfterPage.current) {
      resetAfterPage.current = false
      s.pageX = 0
      s.animate = false
    }
    s.scale = 1
    s.tx = 0
    s.ty = 0
    apply()
  }, [index, apply])

  // Open: history entry, inert page, scroll lock (data-scroll-lock), focus,
  // and the grow from the main photo. The viewer only ever mounts after a
  // tap, so document is always there.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    if (!pushed.current) {
      pushed.current = true
      window.history.pushState({ ...window.history.state, pzViewer: true }, '')
    }
    const onPopState = () => beginClose()
    window.addEventListener('popstate', onPopState)

    const inerted: Element[] = []
    for (const child of Array.from(document.body.children)) {
      if (child !== root && !child.hasAttribute('inert')) {
        child.setAttribute('inert', '')
        inerted.push(child)
      }
    }
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus({ preventScroll: true })

    const hero = heroRef.current
    const backdrop = backdropRef.current
    const chrome = chromeRef.current
    const reduce = prefersReducedMotion()
    if (hero && backdrop && chrome) {
      if (reduce || !origin) {
        hero.style.opacity = '0'
        backdrop.style.opacity = '0'
        chrome.style.opacity = '0'
        void hero.offsetWidth
        for (const el of [hero, backdrop, chrome]) {
          el.style.transition = `opacity 200ms ${EASE}`
          el.style.opacity = '1'
        }
      } else {
        hero.style.transform = flipTransform(origin.rect, origin.naturalWidth, origin.naturalHeight)
        backdrop.style.opacity = '0'
        chrome.style.opacity = '0'
        void hero.offsetWidth
        hero.style.transition = `transform ${DURATION}ms ${EASE}`
        hero.style.transform = 'none'
        backdrop.style.transition = `opacity ${DURATION}ms ${EASE}`
        backdrop.style.opacity = '1'
        chrome.style.transition = `opacity 200ms ${EASE} 100ms`
        chrome.style.opacity = '1'
      }
    }

    return () => {
      window.removeEventListener('popstate', onPopState)
      for (const el of inerted) el.removeAttribute('inert')
      previouslyFocused?.focus({ preventScroll: true })
    }
    // Runs once per open; the callbacks it uses are stable for that lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    // React events bubble out of a portal to the gallery; its arrow keys are
    // for the page, not for this.
    e.stopPropagation()
    if (e.key === 'Escape') {
      e.preventDefault()
      requestClose()
    } else if (e.key === 'ArrowRight') {
      page(1)
    } else if (e.key === 'ArrowLeft') {
      page(-1)
    } else if (e.key === 'Tab') {
      const focusable = Array.from(
        rootRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? []
      )
      if (focusable.length === 0) return
      const first = focusable[0]!
      const lastEl = focusable[focusable.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  // --- Gestures ---

  function clampPan() {
    const s = g.current
    const maxX = ((s.scale - 1) * window.innerWidth) / 2
    const maxY = ((s.scale - 1) * window.innerHeight) / 2
    s.tx = Math.max(-maxX, Math.min(maxX, s.tx))
    s.ty = Math.max(-maxY, Math.min(maxY, s.ty))
  }

  function beginSingle(point: Point) {
    const gs = gesture.current
    const s = g.current
    gs.start = point
    gs.startTime = performance.now()
    gs.startTx = s.tx
    gs.startTy = s.ty
    gs.axis = null
    gs.last = { ...point, t: gs.startTime }
    gs.velocity = { x: 0, y: 0 }
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (closing.current || paging.current) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const gs = gesture.current
    const s = g.current
    s.animate = false
    if (pointers.current.size === 1) {
      gs.pinched = false
      beginSingle({ x: e.clientX, y: e.clientY })
    } else if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values()) as [Point, Point]
      gs.pinched = true
      gs.startDist = Math.hypot(a.x - b.x, a.y - b.y) || 1
      gs.startMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      gs.startScale = s.scale
      gs.startTx = s.tx
      gs.startTy = s.ty
      // A pinch cancels any page or dismiss drag in progress.
      s.pageX = 0
      s.dismissY = 0
      apply()
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId) || closing.current) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const gs = gesture.current
    const s = g.current
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2

    if (pointers.current.size >= 2) {
      const [a, b] = Array.from(pointers.current.values()) as [Point, Point]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const scale = Math.max(1, Math.min(MAX_SCALE, (gs.startScale * dist) / gs.startDist))
      // Keep the point under the fingers fixed while scaling.
      s.tx = mid.x - cx - (scale * (gs.startMid.x - cx - gs.startTx)) / gs.startScale
      s.ty = mid.y - cy - (scale * (gs.startMid.y - cy - gs.startTy)) / gs.startScale
      s.scale = scale
      apply()
      return
    }

    const now = performance.now()
    const dt = now - gs.last.t
    if (dt > 0) {
      gs.velocity = { x: (e.clientX - gs.last.x) / dt, y: (e.clientY - gs.last.y) / dt }
      gs.last = { x: e.clientX, y: e.clientY, t: now }
    }
    const dx = e.clientX - gs.start.x
    const dy = e.clientY - gs.start.y

    if (s.scale > 1) {
      s.tx = gs.startTx + dx
      s.ty = gs.startTy + dy
      apply()
      return
    }

    if (!gs.axis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
      gs.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }
    if (gs.axis === 'x') {
      // Rubber-band past the first and last photo.
      const atEdge = (indexRef.current === 0 && dx > 0) || (indexRef.current === last && dx < 0)
      s.pageX = atEdge ? dx * 0.3 : dx
    } else {
      s.dismissY = Math.max(0, dy)
    }
    apply()
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!pointers.current.delete(e.pointerId) || closing.current) return
    const gs = gesture.current
    const s = g.current

    if (pointers.current.size === 1) {
      // One finger lifted from a pinch: carry on panning from where the
      // other finger is, without a jump.
      const remaining = Array.from(pointers.current.values())[0]!
      beginSingle(remaining)
      return
    }
    if (pointers.current.size > 1) return

    const dx = e.clientX - gs.start.x
    const dy = e.clientY - gs.start.y
    const w = window.innerWidth

    if (s.scale > 1 || gs.pinched) {
      if (s.scale < 1.05) {
        s.scale = 1
        s.tx = 0
        s.ty = 0
      }
      clampPan()
      s.animate = true
      apply()
      return
    }

    if (gs.axis === 'x') {
      if ((dx < -w * 0.25 || gs.velocity.x < -0.5) && indexRef.current < last) return page(1)
      if ((dx > w * 0.25 || gs.velocity.x > 0.5) && indexRef.current > 0) return page(-1)
      s.animate = true
      s.pageX = 0
      apply()
      return
    }

    if (gs.axis === 'y') {
      if (dy > 120 || gs.velocity.y > 0.6) return requestClose()
      s.animate = true
      s.dismissY = 0
      apply()
      return
    }

    // A tap. Two within 300ms toggle zoom at the tapped point.
    const now = performance.now()
    const tap = { x: e.clientX, y: e.clientY }
    const lastTap = gs.lastTap
    if (now - lastTap.t < 300 && Math.hypot(tap.x - lastTap.x, tap.y - lastTap.y) < 30) {
      gs.lastTap = { x: 0, y: 0, t: 0 }
      if (s.scale > 1) {
        s.scale = 1
        s.tx = 0
        s.ty = 0
      } else {
        s.scale = DOUBLE_TAP_SCALE
        s.tx = (window.innerWidth / 2 - tap.x) * (DOUBLE_TAP_SCALE - 1)
        s.ty = (window.innerHeight / 2 - tap.y) * (DOUBLE_TAP_SCALE - 1)
        clampPan()
      }
      s.animate = true
      apply()
    } else {
      gs.lastTap = { ...tap, t: now }
    }
  }

  function handlePointerCancel(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size > 0 || closing.current) return
    const s = g.current
    s.pageX = 0
    s.dismissY = 0
    clampPan()
    s.animate = true
    apply()
  }

  const visible = [index - 1, index, index + 1].filter((i) => i >= 0 && i <= last)

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${carName} photos`}
      data-scroll-lock
      onKeyDown={handleKeyDown}
      className="scheme-dark fixed inset-0 z-[100] overflow-hidden text-ink"
    >
      <div ref={backdropRef} aria-hidden="true" className="absolute inset-0 bg-bg-base" />

      <div
        className="absolute inset-0 touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div ref={heroRef} className="absolute inset-0 will-change-transform">
          <div ref={trackRef} className="absolute inset-0">
            {visible.map((i) => (
              <div
                key={i}
                className="absolute inset-0"
                style={{ transform: `translateX(${(i - index) * 100}%)` }}
                aria-hidden={i !== index}
              >
                <div ref={i === index ? zoomRef : undefined} className="absolute inset-0">
                  {i === startIndex && origin?.src && (
                    // The page's already-loaded photo, so the grow has a
                    // picture from the first frame.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={origin.src} alt="" className="absolute inset-0 size-full object-contain" draggable={false} />
                  )}
                  <Image
                    data-full=""
                    src={images[i]!}
                    alt={`${carName}, photo ${i + 1} of ${images.length}`}
                    fill
                    unoptimized
                    sizes="100vw"
                    draggable={false}
                    className="object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div ref={chromeRef} className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+8px)] flex items-center justify-between">
          <p className="font-body text-[15px] font-semibold tabular-nums" aria-hidden="true">
            {index + 1} / {images.length}
          </p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={requestClose}
            aria-label="Close photos"
            className="glass pointer-events-auto flex size-11 items-center justify-center rounded-full text-ink"
          >
            <X size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+24px)] flex items-center justify-between">
            <button
              type="button"
              onClick={() => page(-1)}
              disabled={index === 0}
              aria-label="Previous photo"
              className="glass pointer-events-auto flex size-11 items-center justify-center rounded-full text-ink disabled:opacity-40"
            >
              <ChevronLeft size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => page(1)}
              disabled={index === last}
              aria-label="Next photo"
              className="glass pointer-events-auto flex size-11 items-center justify-center rounded-full text-ink disabled:opacity-40"
            >
              <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          Photo {index + 1} of {images.length}
        </p>
      </div>
    </div>,
    document.body
  )
}
