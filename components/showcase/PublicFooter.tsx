import { Wordmark } from '@/components/theme/Logo'
import { formatPhoneDisplay } from '@/lib/formatters'
import { getOwnerPhone } from '@/lib/whatsapp'

const OWNER_PHONE = getOwnerPhone()
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL ?? 'pzautomobiles@gmail.com'

export function PublicFooter() {
  return (
    <footer className="bg-ink pt-16 pb-10 px-4 text-center">
      <Wordmark tone="light" className="mx-auto justify-center mb-4" />
      <p className="font-body text-sm text-text-on-dark mb-1">
        Sourced from vetted dealerships and individuals across Lagos.
      </p>
      <div className="flex items-center justify-center gap-4 mt-3">
        <a
          href={`tel:${OWNER_PHONE}`}
          className="font-body text-sm text-text-on-dark hover:text-white transition-colors duration-150 ease-out"
        >
          {formatPhoneDisplay(OWNER_PHONE)}
        </a>
        <span className="text-text-on-dark">·</span>
        <a
          href={`mailto:${OWNER_EMAIL}`}
          className="font-body text-sm text-text-on-dark hover:text-white transition-colors duration-150 ease-out"
        >
          {OWNER_EMAIL}
        </a>
      </div>
      <p className="font-mono text-xs text-text-on-dark mt-6">
        © {new Date().getFullYear()} Pazogu Automobiles. All rights reserved.
      </p>
    </footer>
  )
}
