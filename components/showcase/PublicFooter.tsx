import { Wordmark } from '@/components/theme/Logo'
import { formatPhoneDisplay } from '@/lib/formatters'
import { getOwnerPhone } from '@/lib/whatsapp'

const OWNER_PHONE = getOwnerPhone()
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL ?? 'pzautomobiles@gmail.com'

// The closing contact block for every public page, on the always-dark
// surface in both themes. WhatsApp lives in the pages' own button, not here.
export function PublicFooter() {
  return (
    <footer className="bg-surface-dark">
      <div className="container-page py-section">
        <div className="grid gap-12 md:grid-cols-2 md:items-end">
          <div>
            <h2 className="font-display font-extrabold text-h2 tracking-display text-white">
              Serious about a car?
            </h2>
            <p className="mt-3 max-w-measure font-body text-body text-text-on-dark">
              Call, message or email. No forms, no call centre.
            </p>
          </div>

          <ul className="flex flex-col gap-1 md:items-end">
            <li>
              <a
                href={`tel:${OWNER_PHONE}`}
                className="inline-flex h-11 items-center font-body text-body text-white underline-offset-4 hover:underline"
              >
                {formatPhoneDisplay(OWNER_PHONE)}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${OWNER_EMAIL}`}
                className="inline-flex h-11 items-center break-all font-body text-body text-white underline-offset-4 hover:underline"
              >
                {OWNER_EMAIL}
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark tone="light" className="h-6 md:h-7" />
          <p className="font-body text-caption text-text-on-dark">
            © {new Date().getFullYear()} Pazogu Automobiles. Sourced from vetted dealerships and
            individuals across Lagos.
          </p>
        </div>
      </div>
    </footer>
  )
}
