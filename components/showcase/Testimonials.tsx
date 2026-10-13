import { SectionHeading } from '@/components/showcase/SectionHeading'
import { TESTIMONIALS } from '@/lib/siteContent'

// Written quotes from customers and trade partners, read from
// lib/siteContent.ts. With no entries it renders nothing at all: no heading,
// no wrapper, no spacing. Trade partner entries are labelled so a reader can
// tell them from customers.
export function Testimonials() {
  if (TESTIMONIALS.length === 0) return null

  return (
    <section aria-labelledby="testimonials-heading" className="container-page pb-section">
      <div className="border-t border-hairline pt-section">
        <SectionHeading id="testimonials-heading" eyebrow="Reviews" title="What people say" />

        <ul role="list" className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 md:mt-12 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <li key={item.id} className="break-words border-t border-hairline pt-6">
              <figure>
                {item.relation === 'trade_partner' && (
                  <p className="mb-3 font-body text-caption font-semibold uppercase tracking-widest text-text-muted">
                    Trade partner
                  </p>
                )}
                <blockquote className="font-body text-lead text-ink">{item.quote}</blockquote>
                <figcaption className="mt-4">
                  <p className="font-body text-body font-semibold text-ink">{item.name}</p>
                  {item.detail && (
                    <p className="mt-1 font-body text-caption text-text-muted">{item.detail}</p>
                  )}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
