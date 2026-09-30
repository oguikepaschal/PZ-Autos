import Link from 'next/link'
import { Wordmark } from '@/components/theme/Logo'
import { AdminNav } from '@/components/admin/AdminNav'
import { SignOutButton } from '@/components/admin/SignOutButton'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg-base">
      <header className="bg-ink">
        {/* Mobile: logo and Sign out on the first row, the nav wraps to a
            full-width second row. md up: one row, nav inline after the logo. */}
        <div className="container-page flex flex-wrap items-center justify-between md:flex-nowrap md:gap-8">
          <Link href="/admin" className="flex h-16 items-center rounded-sm">
            <Wordmark tone="light" />
          </Link>
          <AdminNav className="order-last basis-full border-t border-white/10 md:order-none md:basis-auto md:flex-1 md:border-t-0" />
          <SignOutButton />
        </div>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  )
}
