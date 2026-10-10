import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { PublicHeader } from '@/components/showcase/PublicHeader'
import { PublicCarCard } from '@/components/showcase/PublicCarCard'
import { PublicCarGrid } from '@/components/showcase/PublicCarGrid'
import { WhatsAppButton } from '@/components/showcase/WhatsAppButton'
import { getFeaturedCars } from '@/lib/showcase/queries'
import { generateWhatsAppLink, getOwnerPhone } from '@/lib/whatsapp'
import { getSiteOrigin } from '@/lib/siteOrigin'

const OWNER_PHONE = getOwnerPhone()

export const metadata: Metadata = {
  // absolute: this page now sits under the (public) group, so the root
  // layout's "%s | Pazogu Automobiles" template would otherwise apply twice.
  title: { absolute: 'Pazogu Automobiles | Verified cars, direct on WhatsApp' },
}

export const revalidate = 0

export default async function LandingPage() {
  const [featured, siteOrigin] = await Promise.all([getFeaturedCars(), getSiteOrigin()])

  const whatsappLink = generateWhatsAppLink(
    OWNER_PHONE,
    "Hi, I'd like to talk to you about a car."
  )

  return (
    <>
      <PublicHeader />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      {/* Below md the photo sits behind the text under an ink overlay, and
          the section fills the small viewport (svh: never cut off by the
          URL bar, no resize while scrolling). From md up the photo fills
          the right half edge to edge and the section takes content height. */}
      <section className="relative isolate overflow-hidden bg-surface-dark">
        <div className="absolute inset-0 -z-10 md:left-1/2">
          <Image
            src="/hero.jpg"
            alt=""
            fill
            preload
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-[70%_center] md:object-center"
          />
          <div className="absolute inset-0 bg-surface-dark/80 md:hidden" />
        </div>

        <div className="container-page flex min-h-[calc(100svh-var(--spacing-header))] flex-col justify-end py-16 md:min-h-0 md:justify-center md:py-section">
          <div className="md:w-1/2 md:pr-12">
            <h1 className="font-display font-extrabold text-h1 tracking-display text-white">
              Cars worth trusting, verified before they reach you.
            </h1>
            <p className="mt-4 font-display text-lead font-bold tracking-display text-white">
              Japanese. German. Chinese.
            </p>
            <p className="mt-6 max-w-measure font-body text-lead text-white md:text-text-on-dark">
              Sourced from vetted dealerships and individuals across Lagos, checked before
              listing and re-confirmed regularly. You talk to us directly on WhatsApp,
              not a call centre.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/cars"
                className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full bg-white px-6 font-body font-semibold text-body text-surface-dark transition active:scale-98"
              >
                Browse cars
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full border border-white/40 px-6 font-body font-semibold text-body text-white transition hover:border-white active:scale-98"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured (owner-curated, at most 6) ─────────────────────── */}
      {/* Adapts to the count: 0 hides the section, 1 is a wide single
          feature, 2 is two-up, 3 or more is a swipe row on phones and the
          grid from md up. */}
      {featured.length > 0 && (
        <section className="container-page py-section">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="font-display font-extrabold text-h2 tracking-display text-ink">
              Handpicked and inspected
            </h2>
            <Link
              href="/cars"
              className="hidden h-11 shrink-0 items-center font-body font-semibold text-small text-ink underline-offset-4 hover:underline md:inline-flex"
            >
              See all cars
            </Link>
          </div>

          {featured.length === 1 ? (
            <PublicCarCard
              car={featured[0]!}
              siteOrigin={siteOrigin}
              layout="wide"
              sizes="(min-width: 1200px) 600px, (min-width: 768px) 50vw, 100vw"
            />
          ) : featured.length === 2 ? (
            <ul className="grid gap-4 sm:grid-cols-2 md:gap-6">
              {featured.map((car) => (
                <li key={car.id}>
                  <PublicCarCard car={car} siteOrigin={siteOrigin} sizes="(min-width: 640px) 50vw, 100vw" />
                </li>
              ))}
            </ul>
          ) : (
            // 3 or more: the same swipe row as /cars below md, grid from md up.
            <PublicCarGrid cars={featured} siteOrigin={siteOrigin} />
          )}

          <Link
            href="/cars"
            className="mt-6 inline-flex h-11 items-center font-body font-semibold text-body text-ink underline underline-offset-4 md:hidden"
          >
            See all cars
          </Link>
        </section>
      )}

      <WhatsAppButton message="Hi, I'd like to talk to you about a car." label="Chat on WhatsApp" desktop="hidden" />
    </>
  )
}
