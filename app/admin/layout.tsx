import Link from 'next/link'
import { Wordmark } from '@/components/theme/Logo'
import { SignOutButton } from '@/components/admin/SignOutButton'
import { AdminTabBar } from '@/components/admin/AdminTabBar'

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
        {/* Bottom padding clears the fixed tab bar below md. */}
        <main className="mx-auto max-w-[1280px] px-4 md:px-8 pt-8 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">
          {children}
        </main>
      </div>
      <AdminTabBar />
    </div>
  )
}
