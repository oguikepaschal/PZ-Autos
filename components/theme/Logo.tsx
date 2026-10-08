import Image from 'next/image'
import { cn } from '@/lib/utils'

interface WordmarkProps {
  className?: string
  tone?: 'dark' | 'light'
  // Pass true only at a call site that's the single above-the-fold
  // instance on its page (PublicHeader, the login form) — next/image logs
  // an LCP warning without it there. Never set it on PublicFooter, which
  // always renders alongside one of those on the same page.
  priority?: boolean
}

// The PNGs are cropped to the artwork (no transparent padding), so the
// height class is the mark's real visible height.
// tone describes the wordmark's text color, matching call sites written
// before this swapped to real assets: tone="dark" (default) is dark ink on
// a light background (logo-light.png), tone="light" is white text on the
// site's #141414 ink background (logo-dark.png).
export function Wordmark({ className, tone = 'dark', priority = false }: WordmarkProps) {
  const src = tone === 'light' ? '/logo-dark.png' : '/logo-light.png'
  return (
    <Image
      src={src}
      alt="Pazogu Automobiles"
      width={405}
      height={59}
      preload={priority}
      className={cn('h-6 w-auto', className)}
    />
  )
}

// Both wordmark PNGs carry an opaque background (white or #141414), so on a
// themed surface the mark sits on its own always-dark badge rather than
// showing a mismatched rectangle in one of the two themes.
export function WordmarkBadge({ className, priority = false }: Omit<WordmarkProps, 'tone'>) {
  return (
    <span className={cn('inline-flex items-center rounded-lg bg-surface-dark px-2.5 py-2', className)}>
      <Wordmark tone="light" priority={priority} className="h-5" />
    </span>
  )
}
