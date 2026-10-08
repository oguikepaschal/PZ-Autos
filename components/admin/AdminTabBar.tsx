'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, ClipboardList, Archive, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// Cars is the public showcase, a separate app outside the admin scope, so it
// opens in its own context instead of replacing the admin app's window.
const TABS = [
  { href: '/admin', label: 'Inventory', Icon: ClipboardList, external: false },
  { href: '/admin/inventory/new', label: 'Add', Icon: Plus, external: false },
  { href: '/admin/archive', label: 'Archive', Icon: Archive, external: false },
  { href: '/cars', label: 'Cars', Icon: Car, external: true },
]

// The add and edit forms hide the bar: it would ride above the on-screen
// keyboard and cover the field being typed in.
function isFormRoute(pathname: string) {
  return pathname === '/admin/inventory/new' || /^\/admin\/inventory\/[^/]+\/edit$/.test(pathname)
}

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === href : pathname.startsWith(href)
}

export function AdminTabBar() {
  const pathname = usePathname()
  if (isFormRoute(pathname)) return null

  return (
    <>
      {/* In-flow spacer the height of the bar (h-14 + 1px border + inset), so
          the last card is never under it. Renders on the same routes as the
          bar, so the form routes get no dead space. */}
      <div aria-hidden="true" className="h-[calc(3.5rem+1px+env(safe-area-inset-bottom))] md:hidden" />
      <nav
      aria-label="Admin"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-white pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ href, label, Icon, external }) => {
          const active = isActive(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                {...(external ? { target: '_blank', rel: 'noopener' } : {})}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-0.5 font-body text-caption motion-safe:transition-colors',
                  active ? 'font-semibold text-ink' : 'text-text-muted'
                )}
              >
                <Icon size={20} aria-hidden="true" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
      </nav>
    </>
  )
}
