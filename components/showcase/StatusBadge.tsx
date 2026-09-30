import { cn } from '@/lib/utils'

// Status badges never default to red — the brand's ratio constraint
// reserves signal-red for exactly one CTA/accent per screen, and a status
// pill would otherwise be the thing that quietly breaks that budget on
// every single car card.
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  available: {
    label: 'Available',
    className: 'border border-hairline bg-bg-base text-ink',
  },
  reserved: {
    label: 'Reserved',
    className: 'border border-ink bg-bg-base text-ink',
  },
  sold: {
    label: 'Sold',
    className: 'bg-text-muted text-white',
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
