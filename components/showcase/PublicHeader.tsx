import Link from 'next/link'
import { ChevronLeft, Phone } from 'lucide-react'
import { Wordmark } from '@/components/theme/Logo'
import { formatPhoneDisplay } from '@/lib/formatters'
import { getOwnerPhone } from '@/lib/whatsapp'

const OWNER_PHONE = getOwnerPhone()

interface PublicHeaderProps {
  showBackButton?: boolean
}

export function PublicHeader({ showBackButton = false }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-ink">
      <div className="container-page h-header md:h-18 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Link
              href="/cars"
              aria-label="Back to all cars"
              className="-ml-3 inline-flex size-11 items-center justify-center rounded-lg text-text-on-dark transition-colors hover:text-white"
            >
              <ChevronLeft size={24} aria-hidden="true" />
            </Link>
          )}
          <Link href="/" className="rounded-sm">
            <Wordmark tone="light" priority className="h-6 md:h-7" />
          </Link>
        </div>

        {/* Icon-only below md keeps the header to logo plus one action; the
            44px box is the tap target, not the 20px glyph. */}
        <a
          href={`tel:${OWNER_PHONE}`}
          aria-label={`Call ${formatPhoneDisplay(OWNER_PHONE)}`}
          className="-mr-3 md:mr-0 inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 font-body text-small text-white md:text-text-on-dark transition-colors hover:text-white"
        >
          <Phone size={20} aria-hidden="true" />
          <span className="hidden md:inline">{formatPhoneDisplay(OWNER_PHONE)}</span>
        </a>
      </div>
    </header>
  )
}
