// Written content for the public site's trust sections, kept as typed
// constants so every place that shows it reads the same words. No database,
// no CMS: edit this file and redeploy.

export interface AboutItem {
  label: string
  text: string
}

export interface AboutPageSection {
  title: string
  paragraphs?: readonly string[]
  items?: readonly AboutItem[]
}

export interface AboutContent {
  // The short band on the landing page.
  eyebrow: string
  heading: string
  lead: string
  body: string
  linkLabel: string
  // The full /about page.
  page: {
    heading: string
    sections: readonly AboutPageSection[]
  }
}

export const ABOUT: AboutContent = {
  eyebrow: 'About',
  heading: 'I check every car in person.',
  lead: "I'm Paschal and I run Pazogu Automobiles. Cars posted on this site are clean cars from reputable partners and dealerships in Lagos.",
  body: 'When you message on WhatsApp, you reach me. I answer your questions, set a day for you to see it and stay your contact until handover.',
  linkLabel: 'More about Pazogu Automobiles',
  page: {
    heading: 'About Pazogu Automobiles',
    sections: [
      {
        title: 'Who you deal with',
        paragraphs: ['I run Pazogu Automobiles alone. Every call, message and email comes to me.'],
      },
      {
        title: 'What the service covers',
        items: [
          {
            label: 'Sourcing',
            text: 'Japanese, German, Chinese and other cars from trusted dealers and private sellers across Lagos.',
          },
          { label: 'Inspection', text: 'I check each car in person before it goes on the site.' },
          {
            label: 'Listing',
            text: 'Real photos, price and mileage, rechecked while the car stays listed.',
          },
          { label: 'Questions', text: 'Ask on WhatsApp, by phone or by email.' },
        ],
      },
      {
        title: 'My promise',
        paragraphs: ['If I have not seen a car, it is not listed.'],
      },
    ],
  },
}
