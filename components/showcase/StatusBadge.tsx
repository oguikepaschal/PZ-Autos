import { cn } from '@/lib/utils'

// Status badges are never red. Sold uses the always-dark surface so it reads
// the same in both themes.
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  available: {
    label: 'Available',
    className: 'border border-hairline bg-surface text-ink',
  },
  reserved: {
    label: 'Reserved',
    className: 'border border-ink bg-surface text-ink',
  },
  sold: {
    label: 'Sold',
    className: 'bg-surface-dark text-white',
  },
}

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'lg'
  className?: string
}

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  if (!config) return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-body font-semibold',
        size === 'lg' ? 'px-3 py-1 text-small' : 'px-2.5 py-0.5 text-caption',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
