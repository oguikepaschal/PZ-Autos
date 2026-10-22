import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { SpeedmarkHero } from '@/components/hero/SpeedmarkHero'
import { SpeedmarkMotion } from '@/components/hero/SpeedmarkMotion'
import { PublicHeader } from '@/components/showcase/PublicHeader'
import { PublicCarCard } from '@/components/showcase/PublicCarCard'
import { PublicCarGrid } from '@/components/showcase/PublicCarGrid'
import { AboutBand } from '@/components/showcase/AboutBand'
import { Testimonials } from '@/components/showcase/Testimonials'
import { SectionHeading } from '@/components/showcase/SectionHeading'
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
      {/* The Speedmark light trail piece fills the right half from md up. Below
          md it sits right under the nav as the backdrop of the headline, then
          comes a compact car rail and the CTAs, so all three share the first
          screen; the paragraph follows. From md up the section takes content
          height and the rail lives in the featured section below. */}
      <section className="relative isolate overflow-hidden bg-surface-dark">
        <SpeedmarkMotion className="absolute inset-0 -z-10 hidden md:left-1/2 md:block">
          <SpeedmarkHero mode="desktop" />
        </SpeedmarkMotion>

        <div className="container-page flex flex-col max-md:pb-6 md:justify-center md:py-section">
          <div className="max-md:contents md:w-1/2 md:pr-12">
            <div className="relative isolate max-md:order-1 max-md:-mx-5 max-md:px-5 max-md:py-8">
              <SpeedmarkMotion className="absolute inset-0 -z-10 opacity-70 md:hidden">
                <SpeedmarkHero mode="mobile" />
              </SpeedmarkMotion>
              <h1 className="font-display font-extrabold text-h1 tracking-display text-white">
                Cars worth trusting, verified before they reach you.
              </h1>
            </div>

            {featured.length > 0 && (
              <div className="order-2 mt-2 md:hidden">
                <PublicCarGrid cars={featured} siteOrigin={siteOrigin} compact />
              </div>
            )}

            <p className="order-4 mt-6 max-w-measure font-body text-lead text-white md:order-none md:mt-6 md:text-text-on-dark">
              Sourced from vetted dealerships across Lagos, checked before
              listing and re-confirmed regularly. You talk to me directly on WhatsApp,
              not a call centre.
            </p>
            <div className="order-3 mt-5 flex gap-3 max-md:flex-nowrap md:order-none md:mt-8 md:flex-wrap">
              <Link
                href="/cars"
                className="group inline-flex h-12 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-white px-4 font-body font-semibold text-body text-surface-dark transition active:scale-98 max-md:flex-1 md:px-6"
              >
                Browse cars
                <span className="cta-arrow inline-flex transition-[translate] duration-200 ease-out group-hover:translate-x-[3px]">
                  <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
                </span>
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full border border-white/40 px-4 font-body font-semibold text-body text-white transition hover:border-white active:scale-98 max-md:flex-1 md:px-6"
              >
                <span className="md:hidden">WhatsApp me</span>
                <span className="max-md:hidden">Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured (owner-curated, at most 6) ─────────────────────── */}
      {/* From md up only: phones get the compact rail inside the hero. Adapts
          to the count: 0 hides the section, 1 is a wide single feature, 2 is
          two-up, 3 or more is the grid. */}
      {featured.length > 0 && (
        <section className="container-page hidden py-section md:block">
          <div className="mb-8 flex items-end justify-between gap-4">
            <SectionHeading title="Handpicked and inspected" />
            <Link
              href="/cars"
              className="inline-flex h-11 shrink-0 items-center font-body font-semibold text-small text-ink underline-offset-4 hover:underline"
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
            <PublicCarGrid cars={featured} siteOrigin={siteOrigin} />
          )}
        </section>
      )}

      <AboutBand divided={featured.length > 0} />

      <Testimonials />

      <WhatsAppButton message="Hi, I'd like to talk to you about a car." label="Chat on WhatsApp" desktop="hidden" />
    </>
  )
}
