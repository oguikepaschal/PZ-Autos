import { MessageCircle } from 'lucide-react'
import { Wordmark } from '@/components/theme/Logo'
import { formatPhoneDisplay } from '@/lib/formatters'
import { generateWhatsAppLink, getOwnerPhone } from '@/lib/whatsapp'

const OWNER_PHONE = getOwnerPhone()
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL ?? 'pzautomobiles@gmail.com'

// The closing call to action for every public page. The WhatsApp button is
// white on ink, not signal red: on a car's detail page the fixed red
// enquiry bar is already in view at the bottom, and red is one per view.
export function PublicFooter() {
  const whatsappLink = generateWhatsAppLink(
    OWNER_PHONE,
    "Hi, I'd like to talk to you about a car."
  )

  return (
    <footer className="bg-ink">
      <div className="container-page py-section">
        <div className="grid gap-12 md:grid-cols-2 md:items-end">
          <div>
            <h2 className="font-display font-black text-h2 tracking-display text-white">
              Serious about a car?
            </h2>
            <p className="mt-3 max-w-measure font-body text-body text-text-on-dark">
              Message the owner directly. No forms, no call centre.
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-6 font-body font-semibold text-body text-ink transition active:scale-98 sm:w-auto"
            >
              <MessageCircle size={20} aria-hidden="true" />
              Chat on WhatsApp
            </a>
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
