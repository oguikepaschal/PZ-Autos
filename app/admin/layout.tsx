import type { Metadata } from 'next'
import Link from 'next/link'
import { Wordmark } from '@/components/theme/Logo'
import { SignOutButton } from '@/components/admin/SignOutButton'
import { AdminTabBar } from '@/components/admin/AdminTabBar'

// The manifest lives in public/, outside /admin: the proxy redirects every
// /admin/** request to /login when signed out, and a redirected manifest
// breaks install. appleWebApp replaces the root's wholesale, so it repeats
// capable and statusBarStyle.
export const metadata: Metadata = {
  manifest: '/manifest-admin.webmanifest',
  appleWebApp: { capable: true, title: 'PZ Admin', statusBarStyle: 'black' },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-bg-base">
      <header className="sticky top-0 z-40 bg-ink pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <div className="mx-auto max-w-[1280px] px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex h-11 items-center">
              <Wordmark tone="light" />
            </Link>
            <nav className="hidden md:flex items-center gap-6 font-body text-sm">
              <Link href="/admin" className="inline-flex min-h-11 items-center text-text-on-dark hover:text-white transition-colors">
                Inventory
              </Link>
              <Link
                href="/admin/inventory/new"
                className="inline-flex min-h-11 items-center text-text-on-dark hover:text-white transition-colors"
              >
                Add car
              </Link>
              <Link
                href="/admin/archive"
                className="inline-flex min-h-11 items-center text-text-on-dark hover:text-white transition-colors"
              >
                Archive
              </Link>
            </nav>
          </div>
          <SignOutButton />
        </div>
      </header>
      <div className="pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <main className="mx-auto max-w-[1280px] px-4 md:px-8 py-8">
          {children}
        </main>
      </div>
      <AdminTabBar />
    </div>
  )
}
