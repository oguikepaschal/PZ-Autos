'use client'

import { ArrowRight, MessageCircle } from 'lucide-react'
import { generateWhatsAppLink, getOwnerPhone } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'

// Fire-and-forget: the tap is queued and the link opens on the same click
// regardless. A failed or blocked request never affects the chat opening.
export function recordClick(carId: string) {
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

interface WhatsAppButtonProps {
  message: string
  label: string
  // Present on a car's page: the tap is recorded against that car.
  carId?: string
  // 'inline' drops into the page flow from md up (a car's page); 'hidden'
  // hides it there, for a page whose own content already carries the action.
  desktop?: 'inline' | 'hidden'
}

// Below md: a floating glass pill above the home indicator (the page adds
// matching bottom padding so it never covers content). The WhatsApp glyph is
// one of signal red's allowed uses.
export function WhatsAppButton({ message, label, carId, desktop = 'inline' }: WhatsAppButtonProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-4 bottom-[calc(26px+env(safe-area-inset-bottom))] z-40',
        desktop === 'inline' ? 'md:static md:mt-6' : 'md:hidden'
      )}
    >
      <a
        href={generateWhatsAppLink(getOwnerPhone(), message)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={carId ? () => recordClick(carId) : undefined}
        className="glass mx-auto flex h-[62px] max-w-md items-center justify-center gap-2.5 rounded-[31px] font-body text-base font-bold text-ink transition-transform active:scale-[0.98] md:mx-0"
      >
        <MessageCircle size={22} strokeWidth={2} aria-hidden="true" className="text-signal-red" />
        {label}
      </a>
    </div>
  )
}

// The card's Enquire link: the same link logic and the same tap recording as
// the car page's pill.
export function EnquireLink({ carId, message, carTitle }: { carId: string; message: string; carTitle: string }) {
  return (
    <a
      href={generateWhatsAppLink(getOwnerPhone(), message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => recordClick(carId)}
      aria-label={`Enquire about the ${carTitle} on WhatsApp`}
      className="-mr-1 inline-flex h-11 items-center gap-1 px-1 font-body text-[15px] font-bold text-ink"
    >
      Enquire
      <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
    </a>
  )
}
