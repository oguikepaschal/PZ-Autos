import Link from 'next/link'
import { Phone } from 'lucide-react'
import { Wordmark } from '@/components/theme/Logo'
import { formatPhoneDisplay } from '@/lib/formatters'
import { getOwnerPhone } from '@/lib/whatsapp'

const OWNER_PHONE = getOwnerPhone()

interface PublicHeaderProps {
  showBackButton?: boolean
}

export function PublicHeader({ showBackButton = false }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-ink border-b border-ink">
      <div className="mx-auto max-w-[1280px] h-16 md:h-[72px] px-4 md:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Link href="/cars" className="text-text-on-dark hover:text-white transition-colors">
              ←
            </Link>
          )}
          <Link href="/cars">
            <Wordmark tone="light" priority />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={`tel:${OWNER_PHONE}`}
            className="inline-flex items-center gap-2 font-body text-sm text-text-on-dark hover:text-white transition-colors duration-150 ease-out"
          >
            <Phone size={16} />
            <span className="hidden sm:inline">{formatPhoneDisplay(OWNER_PHONE)}</span>
          </a>
        </div>
      </div>
    </header>
  )
}
