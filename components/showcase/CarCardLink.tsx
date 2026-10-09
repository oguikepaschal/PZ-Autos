'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { recordCardTap } from '@/lib/cardTap'

// A car card's link to the car's page. The tap is counted on the click itself,
// never on the page load, so shared links and previews don't count.
export function CarCardLink({ carId, ...props }: ComponentProps<typeof Link> & { carId: string }) {
  return <Link {...props} onClick={() => recordCardTap(carId)} />
}
