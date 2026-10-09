import { formatCarTitle } from './formatters'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special chars
    .replace(/[\s_-]+/g, '-') // spaces/underscores to hyphens
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
}

// Only called when a car is created; slugs are never regenerated on edit, so
// existing URLs keep their original form.
export function generateCarSlug(car: Parameters<typeof formatCarTitle>[0]): string {
  const base = slugify(formatCarTitle(car))
  const suffix = Math.random().toString(36).substring(2, 7) // 5-char random suffix
  return `${base}-${suffix}`
}
