'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Archive, ExternalLink, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// Cars is the public showcase, a separate app outside the admin scope, so it
// opens in its own context instead of replacing the admin app's window.
const TABS = [
  { href: '/admin', label: 'Inventory', Icon: LayoutGrid, external: false },
  { href: '/admin/archive', label: 'Archive', Icon: Archive, external: false },
  { href: '/cars', label: 'Cars', Icon: ExternalLink, external: true },
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
      {/* In-flow spacer: the bar's 62px, its 26px lift and a 16px gap, plus
          the inset, so the last card is never under it. Renders on the same
          routes as the bar, so the form routes get no dead space. */}
      <div aria-hidden="true" className="h-[calc(104px+env(safe-area-inset-bottom))] md:hidden" />
      <nav
        aria-label="Admin"
        className="fixed inset-x-0 bottom-[calc(26px+env(safe-area-inset-bottom))] z-40 flex items-center justify-center gap-3 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:hidden"
      >
        <ul className="glass flex h-[62px] w-[262px] rounded-[31px] p-[5px]">
          {TABS.map(({ href, label, Icon, external }) => {
            const active = isActive(pathname, href)
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  {...(external ? { target: '_blank', rel: 'noopener' } : {})}
                  className={cn(
                    'flex h-full flex-col items-center justify-center gap-0.5 rounded-[26px] font-body text-[11px] transition-transform active:scale-[0.97]',
                    active ? 'bg-tab-highlight font-bold text-signal-red' : 'font-semibold text-ink'
                  )}
                >
                  <Icon size={22} strokeWidth={active ? 2 : 1.8} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
        <Link
          href="/admin/inventory/new"
          aria-label="Add car"
          className="glass flex size-[62px] items-center justify-center rounded-full text-ink transition-transform active:scale-[0.97]"
        >
          <Plus size={26} strokeWidth={2} aria-hidden="true" />
        </Link>
      </nav>
    </>
  )
}
