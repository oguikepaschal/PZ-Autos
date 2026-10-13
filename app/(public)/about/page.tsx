import type { Metadata } from 'next'
import { PublicHeader } from '@/components/showcase/PublicHeader'
import { SectionHeading } from '@/components/showcase/SectionHeading'
import { ABOUT } from '@/lib/siteContent'

export const metadata: Metadata = {
  title: 'About',
}

export default function AboutPage() {
  const { page } = ABOUT

  return (
    <>
      <PublicHeader />
      <div className="container-page pt-12 pb-section md:pt-section">
        <SectionHeading as="h1" size="h1" title={page.heading} />

        <div className="mt-12 border-t border-hairline md:mt-16">
          {page.sections.map((section, index) => {
            const headingId = `about-section-${index}`
            return (
              <section
                key={section.title}
                aria-labelledby={headingId}
                className="grid gap-4 border-b border-hairline py-8 md:grid-cols-12 md:gap-12 md:py-12"
              >
                <SectionHeading
                  id={headingId}
                  size="h3"
                  title={section.title}
                  className="md:col-span-4"
                />
                <div className="grid gap-4 md:col-span-8">
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="max-w-measure font-body text-lead text-ink">
                      {paragraph}
                    </p>
                  ))}
                  {section.items && (
                    <dl className="grid gap-y-6">
                      {section.items.map((item) => (
                        <div key={item.label} className="grid gap-1 lg:grid-cols-12 lg:gap-x-8">
                          <dt className="font-body text-body font-semibold text-ink lg:col-span-3">
                            {item.label}
                          </dt>
                          <dd className="max-w-measure font-body text-body text-ink lg:col-span-9">
                            {item.text}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </>
  )
}
