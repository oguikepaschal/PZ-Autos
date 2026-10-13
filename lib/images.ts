// car-images is a private bucket. Browsers never talk to Storage directly:
//
// - Showcase pages use /img/<path>, served with the anon key, so Postgres RLS
//   (car_is_publicly_visible) decides what is visible.
// - Admin screens use /admin/img/<path>, served with the owner's session, so
//   draft, withdrawn and not-yet-saved photos preview too.
//
// Both are plain relative URLs, so these helpers work on server and client.
export function getShowcaseImageUrl(storagePath: string): string {
  return `/img/${storagePath}`
}

export function getAdminImageUrl(storagePath: string): string {
  return `/admin/img/${storagePath}`
}
