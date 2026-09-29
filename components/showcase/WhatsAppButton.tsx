import { MessageCircle } from 'lucide-react'
import { generateWhatsAppLink, getOwnerPhone } from '@/lib/whatsapp'

interface WhatsAppButtonProps {
  message: string
}

// Below md: a bottom bar pinned above the home indicator (the page adds
// matching bottom padding so it never covers content). From md up it drops
// out of fixed positioning and sits inline where it is rendered.
export function WhatsAppButton({ message }: WhatsAppButtonProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:static md:mt-4 md:border-0 md:bg-transparent md:p-0">
      <a
        href={generateWhatsAppLink(getOwnerPhone(), message)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal-red py-3 font-body text-sm font-semibold text-white"
      >
        <MessageCircle size={18} aria-hidden="true" />
        Chat on WhatsApp
      </a>
    </div>
  )
}
