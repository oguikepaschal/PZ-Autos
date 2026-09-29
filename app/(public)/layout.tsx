import { PublicFooter } from '@/components/showcase/PublicFooter'

// Each page renders its own <PublicHeader> (with or without the back
// button) — the listing is a root screen and stays bare, while a car's
// detail page shows the back-to-listing affordance. Keeping that choice at
// the page level avoids a shared layout guessing from the route. The footer
// has no such variation, so this layout is its only owner.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col">
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
