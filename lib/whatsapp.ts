import { normalizeNigerianPhone } from '@/lib/formatters'

// Client-side WhatsApp deep link only. No server-side send path — Twilio is
// explicitly out of scope for this product (single owner, direct WhatsApp
// access is part of the trust story, not an automated notification system).
export function generateWhatsAppLink(phone: string, message: string): string {
  const normalized = normalizeNigerianPhone(phone)
  const e164 = normalized.replace('+', '')
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`
}

// NEXT_PUBLIC_OWNER_PHONE overrides the fallback number; every public
// surface (links, contact bars, WhatsApp) reads the number through this.
export function getOwnerPhone(): string {
  return normalizeNigerianPhone(process.env.NEXT_PUBLIC_OWNER_PHONE ?? '+2348116563757')
}

export function generateCarEnquiryMessage(carTitle: string, price: string, pageUrl: string): string {
  return `Hi, I'm interested in the ${carTitle} listed at ${price}. Is it still available? ${pageUrl}`
}
