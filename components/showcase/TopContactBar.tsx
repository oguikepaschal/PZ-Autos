import { formatPhoneDisplay } from '@/lib/formatters'
import { getOwnerPhone } from '@/lib/whatsapp'

const OWNER_PHONE = getOwnerPhone()
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL ?? 'pzautomobiles@gmail.com'

// Landing-page-only slim strip above the main nav. Deliberately carries no
// location names — "Mon-Sat · 9am-6pm" is availability to talk, not a
// physical-premises claim.
export function TopContactBar() {
  return (
    <div className="bg-ink border-b border-white/10">
      <div className="mx-auto max-w-[1280px] px-4 md:px-10 h-9 flex items-center justify-between text-[11px] font-body text-text-on-dark">
        <span>Mon–Sat · 9am–6pm</span>
        <div className="flex items-center gap-4">
          <a href={`tel:${OWNER_PHONE}`} className="hover:text-white transition-colors">
            {formatPhoneDisplay(OWNER_PHONE)}
          </a>
          <a href={`mailto:${OWNER_EMAIL}`} className="hidden sm:inline hover:text-white transition-colors">
            {OWNER_EMAIL}
          </a>
        </div>
      </div>
    </div>
  )
}
