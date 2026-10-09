'use client'

import { ArrowRight, MessageCircle } from 'lucide-react'
import { generateWhatsAppLink, getOwnerPhone } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'

interface WhatsAppButtonProps {
  message: string
  label: string
  // 'inline' drops into the page flow from md up (a car's page); 'hidden'
  // hides it there, for a page whose own content already carries the action.
  desktop?: 'inline' | 'hidden'
}

// Below md: a floating glass pill above the home indicator (the page adds
// matching bottom padding so it never covers content). The WhatsApp glyph is
// one of signal red's allowed uses.
export function WhatsAppButton({ message, label, desktop = 'inline' }: WhatsAppButtonProps) {
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
        className="glass mx-auto flex h-[62px] max-w-md items-center justify-center gap-2.5 rounded-[31px] font-body text-base font-bold text-ink transition-transform active:scale-[0.98] md:mx-0"
      >
        <MessageCircle size={22} strokeWidth={2} aria-hidden="true" className="text-signal-red" />
        {label}
      </a>
    </div>
  )
}

// The card's Enquire link: the same link logic as the car page's pill.
export function EnquireLink({ message, carTitle }: { message: string; carTitle: string }) {
  return (
    <a
      href={generateWhatsAppLink(getOwnerPhone(), message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Enquire about the ${carTitle} on WhatsApp`}
      className="-mr-1 inline-flex h-11 items-center gap-1 px-1 font-body text-[15px] font-bold text-ink"
    >
      Enquire
      <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
    </a>
  )
}
