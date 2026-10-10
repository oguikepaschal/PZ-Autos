'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { Maximize2 } from 'lucide-react'
import { PhotoViewer, type ViewerOrigin } from './PhotoViewer'
import { cn } from '@/lib/utils'

const ADVANCE_MS = 2000

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}

interface GalleryImage {
  // The public URL of the stored file, the largest version there is.
  url: string
  sort_order: number
  is_cover: boolean
}

interface CarGalleryProps {
  images: GalleryImage[]
  carName: string
}

// The main photo (full width on phones, 4:3) with a thumbnail strip below.
// A thumbnail makes its photo the main one; the main photo opens the
// full-screen viewer, and when the viewer closes the main photo shows the
// last photo viewed. The photos advance on their own every 2s and loop, and
// hold while the gallery is hovered (mouse), touched, keyboard-focused, open
// in the viewer or in a hidden tab. A manual change restarts the clock, and
// reduced motion turns it off.
export function CarGallery({ images, carName }: CarGalleryProps) {
  const ordered = [...images].sort((a, b) => {
    if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1
    return a.sort_order - b.sort_order
  })

  const [active, setActive] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [touching, setTouching] = useState(false)
  const [focused, setFocused] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)
  const count = ordered.length
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  )
  const tabHidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.hidden,
    () => false
  )
  const paused = hovered || touching || focused || viewerOpen || tabHidden
  const mainRef = useRef<HTMLButtonElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const getOrigin = useCallback((): ViewerOrigin | null => {
    const button = mainRef.current
    const img = imgRef.current
    if (!button) return null
    return {
      rect: button.getBoundingClientRect(),
      src: img?.currentSrc ?? '',
      naturalWidth: img?.naturalWidth || 4,
      naturalHeight: img?.naturalHeight || 3,
    }
  }, [])

  // iOS doesn't focus a tapped button, so focus goes back to the main photo
  // explicitly rather than to whatever the viewer found focused.
  const closeViewer = useCallback(() => {
    setViewerOpen(false)
    mainRef.current?.focus({ preventScroll: true })
  }, [])

  // Keyed on `active`, so any change, manual or automatic, restarts the 2s.
  useEffect(() => {
    if (count <= 1 || reduceMotion || paused) return
    const timer = setTimeout(() => setActive((i) => (i + 1) % count), ADVANCE_MS)
    return () => clearTimeout(timer)
  }, [active, count, reduceMotion, paused])

  // Keep the active thumbnail inside the strip. Sets the strip's scrollLeft
  // rather than calling scrollIntoView, which could scroll the page too.
  useEffect(() => {
    const strip = stripRef.current
    const thumb = strip?.children[active] as HTMLElement | undefined
    if (!strip || !thumb) return
    const stripRect = strip.getBoundingClientRect()
    const thumbRect = thumb.getBoundingClientRect()
    const gap = 8
    if (thumbRect.left < stripRect.left + gap) {
      strip.scrollLeft += thumbRect.left - stripRect.left - gap
    } else if (thumbRect.right > stripRect.right - gap) {
      strip.scrollLeft += thumbRect.right - stripRect.right + gap
    }
  }, [active])

  function handleKeyDown(e: React.KeyboardEvent) {
    // A key press inside the gallery means keyboard use, which holds autoplay.
    setFocused(true)
    if (e.key === 'ArrowLeft' && active > 0) {
      e.preventDefault()
      setActive(active - 1)
    } else if (e.key === 'ArrowRight' && active < ordered.length - 1) {
      e.preventDefault()
      setActive(active + 1)
    }
  }

  if (ordered.length === 0) {
    return (
      <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-fill md:rounded-2xl lg:aspect-16/10">
        <span className="font-body text-small text-text-muted">Photo coming soon</span>
      </div>
    )
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
      onTouchStart={() => setTouching(true)}
      onTouchEnd={(e) => e.touches.length === 0 && setTouching(false)}
      onTouchCancel={(e) => e.touches.length === 0 && setTouching(false)}
      onFocus={(e) => e.target.matches(':focus-visible') && setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
      }}
    >
      <button
        ref={mainRef}
        type="button"
        onClick={() => setViewerOpen(true)}
        aria-label={`${carName}, photo ${active + 1} of ${count}. Open full screen`}
        className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden bg-fill md:rounded-2xl lg:aspect-16/10"
      >
        <Image
          ref={imgRef}
          src={ordered[active]!.url}
          alt=""
          fill
          quality={85}
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover"
          // Hidden while the viewer is open: the viewer's copy is the photo
          // that grows out of this spot and shrinks back into it.
          style={{ opacity: viewerOpen ? 0 : 1 }}
          priority={active === 0}
        />
        {count > 1 && (
          // Warms the optimized URL of the next photo (same sizes and quality
          // as the main one) so the swap never shows a blank frame.
          <Image
            src={ordered[(active + 1) % count]!.url}
            alt=""
            aria-hidden="true"
            tabIndex={-1}
            fill
            quality={85}
            sizes="(max-width: 1024px) 100vw, 55vw"
            loading="eager"
            className="pointer-events-none object-cover"
            style={{ opacity: 0 }}
          />
        )}
        <span className="glass absolute bottom-4 left-4 rounded-full px-2.5 py-1 font-body text-xs font-bold text-ink tabular-nums">
          {active + 1} / {count}
        </span>
        <span className="glass absolute right-4 bottom-4 flex size-9 items-center justify-center rounded-full text-ink">
          <Maximize2 size={16} strokeWidth={2} aria-hidden="true" />
        </span>
      </button>

      {count > 1 && (
        <div
          ref={stripRef}
          className="mt-3 flex gap-2 overflow-x-auto overscroll-x-contain px-5 py-0.5 scrollbar-hide md:px-0.5"
        >
          {ordered.map((image, i) => (
            <button
              key={`${image.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active ? 'true' : undefined}
              className={cn(
                'h-12 w-16 shrink-0 rounded-[10px] border-2 p-0.5 transition-colors',
                i === active ? 'border-ink' : 'border-transparent'
              )}
            >
              <span className="relative block size-full overflow-hidden rounded-[7px] bg-fill">
                <Image src={image.url} alt="" fill sizes="64px" quality={70} className="object-cover" />
              </span>
            </button>
          ))}
        </div>
      )}

      {viewerOpen && (
        <PhotoViewer
          images={ordered.map((image) => image.url)}
          startIndex={active}
          carName={carName}
          getOrigin={getOrigin}
          onIndexChange={setActive}
          onClosed={closeViewer}
        />
      )}
    </div>
  )
}
