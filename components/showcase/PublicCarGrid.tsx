import { PublicCarCard } from './PublicCarCard'
import { CarRail } from './CarRail'
import { cn } from '@/lib/utils'
import { formatCarTitle } from '@/lib/formatters'
import type { PublicCarCardData } from '@/lib/showcase/types'

interface PublicCarGridProps {
  cars: PublicCarCardData[]
  siteOrigin: string
  autoAdvance?: boolean
  // 220px cards instead of 300px, for the landing hero. Phone rail only.
  compact?: boolean
  emptyMessage?: string
}

// Below md a swipe row of 300px cards with the next one peeking; from md up a
// grid. The cards stay server-rendered; CarRail adds the scrolling behaviour.
// With autoAdvance the row drifts instead of snapping, so it drops snap and
// renders the cards a second time as a hidden-from-AT copy for the loop.
export function PublicCarGrid({
  cars,
  siteOrigin,
  autoAdvance = false,
  compact = false,
  emptyMessage = 'No cars listed right now.',
}: PublicCarGridProps) {
  if (cars.length === 0) {
    return <p className="font-body text-body text-text-muted py-12">{emptyMessage}</p>
  }

  return (
    <CarRail labels={cars.map((car) => formatCarTitle(car))} autoAdvance={autoAdvance}>
      {cars.map((car) => (
        <li
          key={car.id}
          className={cn(compact ? 'w-[220px]' : 'w-[300px]', 'shrink-0 md:w-auto', !autoAdvance && 'snap-start')}
        >
          <PublicCarCard car={car} siteOrigin={siteOrigin} compact={compact} />
        </li>
      ))}
      {autoAdvance &&
        cars.map((car) => (
          <li key={`${car.id}-loop`} data-loop-copy aria-hidden="true" className="w-[300px] shrink-0 md:hidden">
            <PublicCarCard car={car} siteOrigin={siteOrigin} />
          </li>
        ))}
    </CarRail>
  )
}
