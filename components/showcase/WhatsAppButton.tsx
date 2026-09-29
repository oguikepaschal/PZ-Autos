'use client'

import { MessageCircle } from 'lucide-react'
import { generateWhatsAppLink, getOwnerPhone } from '@/lib/whatsapp'

interface WhatsAppButtonProps {
  carId: string
  message: string
}

// Fire-and-forget: the tap is queued and the link opens on the same click
// regardless. A failed or blocked request never affects the chat opening.
function recordClick(carId: string) {
  try {
    const payload = JSON.stringify({ car_id: carId })
    const queued =
      typeof navigator.sendBeacon === 'function' &&
      navigator.sendBeacon('/api/whatsapp-click', new Blob([payload], { type: 'application/json' }))
    if (!queued) {
      fetch('/api/whatsapp-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // Recording is best effort.
  }
}

// Below md: a bottom bar pinned above the home indicator (the page adds
// matching bottom padding so it never covers content). From md up it drops
// out of fixed positioning and sits inline where it is rendered.
export function WhatsAppButton({ carId, message }: WhatsAppButtonProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:static md:mt-4 md:border-0 md:bg-transparent md:p-0">
      <a
        href={generateWhatsAppLink(getOwnerPhone(), message)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordClick(carId)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal-red py-3 font-body text-sm font-semibold text-white"
      >
        <MessageCircle size={18} aria-hidden="true" />
        Chat on WhatsApp
      </a>
    </div>
  )
}
