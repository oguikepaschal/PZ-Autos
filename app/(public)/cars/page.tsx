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

  return (
    <>
      <PublicHeader />
      {/* Below md the floating WhatsApp pill needs its height plus its lift
          and the home-indicator inset kept clear at the end of the page. From
          md up the button sits in the flow under the list. */}
      <div className="container-page pt-8 pb-[calc(112px+env(safe-area-inset-bottom))] md:py-section">
        <p className="font-body text-xs font-bold tracking-[0.24em] text-signal-red">INVENTORY</p>
        <h1 className="mt-2 font-display font-extrabold text-h2 tracking-display text-ink">
          Every car currently on offer
        </h1>
        <p className="mt-2 font-body text-[15px] leading-snug text-text-muted md:text-body">
          All checked before listing with direct WhatsApp access
        </p>
        <div className="mt-6 md:mt-8">
          <PublicCarGrid cars={cars} siteOrigin={siteOrigin} autoAdvance />
        </div>
        <WhatsAppButton message="Hi, I'd like to talk to you about a car." label="Chat on WhatsApp" />
      </div>
    </>
  )
}
