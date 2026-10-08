import type { Metadata, Viewport } from 'next'
import { PublicFooter } from '@/components/showcase/PublicFooter'

// The landing page and /cars pages all install the cars showcase. Chrome
// doesn't require the page to sit inside the manifest's scope, so the
// landing page can offer the install too.
export const metadata: Metadata = {
  manifest: '/manifest-cars.webmanifest',
  appleWebApp: { capable: true, title: 'PZ Autos', statusBarStyle: 'black' },
}

// The landing page and /cars open on the always-dark header, and a car's page
// opens on its photo, so the browser chrome stays the dark surface in both
// schemes.
export const viewport: Viewport = { themeColor: '#141414' }

// Each page renders its own <PublicHeader> (with or without the back
// button) — the listing is a root screen and stays bare, while a car's
// detail page shows the back-to-listing affordance. Keeping that choice at
// the page level avoids a shared layout guessing from the route. The footer
// has no such variation, so this layout is its only owner.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col">
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
