'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/admin', label: 'Inventory' },
  { href: '/admin/inventory/new', label: 'Add car' },
  { href: '/admin/archive', label: 'Archive' },
] as const

// Editing a car is part of Inventory, so /admin/inventory/[id]/edit marks
// Inventory active; only the exact "new" route belongs to Add car.
function isActive(href: string, pathname: string) {
  if (href === '/admin') {
    return pathname === '/admin' || (pathname.startsWith('/admin/inventory/') && pathname !== '/admin/inventory/new')
  }
  return pathname === href
}

// Below md this is a full-width row of equal tabs under the logo, so every
// destination is one tap away; from md up it sits inline in the header.
export function AdminNav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin" className={cn('flex font-body text-small', className)}>
      {LINKS.map(({ href, label }) => {
        const active = isActive(href, pathname)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-12 flex-1 items-center justify-center border-b-2 px-3 transition-colors md:h-16 md:flex-none',
              active
                ? 'border-white font-semibold text-white'
                : 'border-transparent text-text-on-dark hover:text-white'
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
