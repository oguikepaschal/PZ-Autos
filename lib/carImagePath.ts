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
