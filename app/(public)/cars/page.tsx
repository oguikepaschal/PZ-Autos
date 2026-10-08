import type { Metadata } from 'next'
import { PublicHeader } from '@/components/showcase/PublicHeader'
import { PublicCarGrid } from '@/components/showcase/PublicCarGrid'
import { WhatsAppButton } from '@/components/showcase/WhatsAppButton'
import { getPublicCars } from '@/lib/showcase/queries'
import { getSiteOrigin } from '@/lib/siteOrigin'

export const metadata: Metadata = {
  title: 'All cars',
  description: 'Verified cars sourced from vetted dealerships and individuals across Lagos.',
}

export const revalidate = 0

export default async function CarsPage() {
  const [cars, siteOrigin] = await Promise.all([getPublicCars(), getSiteOrigin()])

  const countLine = cars.length > 0 ? `${cars.length === 1 ? '1 car' : `${cars.length} cars`}. ` : ''

  return (
    <>
      <PublicHeader />
      {/* Below md the floating WhatsApp pill needs its height plus its lift
          and the home-indicator inset kept clear at the end of the page. */}
      <div className="container-page pt-8 pb-[calc(112px+env(safe-area-inset-bottom))] md:py-section">
        <p className="font-body text-xs font-bold tracking-[0.24em] text-signal-red">INVENTORY</p>
        <h1 className="mt-2 font-display font-extrabold text-h2 tracking-display text-ink">
          Every car currently on offer
        </h1>
        {/* The count matters most below md, where the list is a swipe row
            and the total isn't visible at a glance. */}
        <p className="mt-2 font-body text-[15px] leading-snug text-text-muted md:text-body">
          {countLine}Checked before listing, with direct WhatsApp access to the owner.
        </p>
        <div className="mt-6 md:mt-8">
          <PublicCarGrid cars={cars} siteOrigin={siteOrigin} autoAdvance />
        </div>
      </div>
      <WhatsAppButton
        message="Hi, I'd like to talk to you about a car."
        label="WhatsApp the owner"
        desktop="hidden"
      />
    </>
  )
}
