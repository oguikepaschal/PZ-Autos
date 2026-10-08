import { headers } from 'next/headers'

// The origin this request came in on, for absolute links in WhatsApp
// messages. Server-only (reads request headers).
export async function getSiteOrigin(): Promise<string> {
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
  return `${protocol}://${host}`
}
