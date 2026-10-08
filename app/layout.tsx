import type { Metadata, Viewport } from 'next'
import { Archivo, Barlow } from 'next/font/google'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-archivo',
  display: 'swap',
})

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-barlow',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Pazogu Automobiles',
    template: '%s | Pazogu Automobiles',
  },
  description:
    'Verified cars sourced from vetted dealerships and individuals across Lagos, with direct WhatsApp access to the owner.',
  icons: {
    // No media query = default/fallback, also matches light mode explicitly.
    // Dark-mode browsers (tab bar, bookmarks, PWA icon) get the dark-bg mark
    // instead so it doesn't sit as a stray white square in dark chrome.
    icon: [
      { url: '/icon-512.png', type: 'image/png' },
      {
        url: '/icon-512-dark.png',
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
  // 'black' keeps iOS's status bar opaque, so pages start below it and the
  // ink header lines up; black-translucent would draw under the status bar.
  appleWebApp: {
    capable: true,
    title: 'PZ Autos',
    statusBarStyle: 'black',
  },
  // Next only emits the unprefixed mobile-web-app-capable; iOS before 16.4
  // reads the prefixed tag.
  other: { 'apple-mobile-web-app-capable': 'yes' },
}

// viewport-fit=cover lets fixed bars pad themselves clear of the notch and
// home indicator with env(safe-area-inset-*). One theme-color is enough: the
// site is light-only (color-scheme: light) and every page opens on the ink
// header, so the browser chrome matches it in either OS scheme.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#141414',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${barlow.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
