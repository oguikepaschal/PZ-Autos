// Car photos live at `<folder>/<file>.jpg|jpeg`, both halves UUIDs. Older
// listings use a `car-<uuid>` folder. Image routes and the colour-suggestion
// API turn a caller-supplied path into a Storage lookup, so it is checked
// against exactly this shape and refused otherwise — never sanitised.
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const CAR_IMAGE_PATH = new RegExp(`^(?:car-)?${UUID}/${UUID}\\.jpe?g$`)

export function isCarImagePath(path: string): boolean {
  return CAR_IMAGE_PATH.test(path)
}

// Joins route segments back into a storage path, or null when the request is
// not a car photo path. Encoded slashes arrive decoded inside a segment, so a
// segment count other than two, or any stray character, fails the pattern.
export function carImagePathFromSegments(segments: string[]): string | null {
  if (segments.length !== 2) return null
  const path = segments.join('/')
  return isCarImagePath(path) ? path : null
}

// An encoded slash or backslash in the URL is refused outright, even where
// the platform would decode it into a valid two-segment path: photo URLs have
// exactly one spelling, so no variant gets through the check.
export function carImagePathFromRequest(requestUrl: string, segments: string[]): string | null {
  if (/%(?:2f|5c)/i.test(new URL(requestUrl).pathname)) return null
  return carImagePathFromSegments(segments)
}
