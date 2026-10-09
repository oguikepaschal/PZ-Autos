'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type ActionResult = { ok: true } | { ok: false; error: string }

// Expected DB failures come back as a result the UI shows instead of a throw
// that crashes the page. The raw error stays in the server log: it carries
// table and constraint names the admin has no use for.
function failed(context: string, error: unknown): ActionResult {
  console.error(`[admin] ${context} failed`, error)
  return { ok: false, error: "Couldn't update this car. Try again." }
}

export async function setCarFeatured(carId: string, featured: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_car_featured', {
    p_car_id: carId,
    p_featured: featured,
  })
  if (error) return failed('setCarFeatured', error)
  revalidatePath('/admin')
  revalidatePath('/')
  return { ok: true }
}

// Arrow-button reordering: swap the given car with its neighbour in the
// current featured_order sequence, then push the whole sequence through
// reorder_featured. Two DB round trips (read current order, then rewrite
// it) rather than a single clever UPDATE — this list is at most 6 rows, so
// the simplicity is worth more than the extra round trip.
async function swapFeatured(carId: string, direction: 'up' | 'down'): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: featured, error } = await supabase
    .from('cars')
    .select('id, featured_order')
    .eq('is_featured', true)
    .order('featured_order', { ascending: true })

  if (error) return failed('swapFeatured read', error)
  if (!featured) return { ok: true }

  const ids = featured.map((c) => c.id as string)
  const index = ids.indexOf(carId)
  if (index === -1) return { ok: true }

  const swapWith = direction === 'up' ? index - 1 : index + 1
  if (swapWith < 0 || swapWith >= ids.length) return { ok: true }

  const tmp = ids[index]!
  ids[index] = ids[swapWith]!
  ids[swapWith] = tmp

  const { error: reorderError } = await supabase.rpc('reorder_featured', {
    p_ordered_ids: ids,
  })
  if (reorderError) return failed('swapFeatured reorder', reorderError)

  revalidatePath('/admin')
  revalidatePath('/')
  return { ok: true }
}

export async function moveFeaturedUp(carId: string): Promise<ActionResult> {
  return swapFeatured(carId, 'up')
}

export async function moveFeaturedDown(carId: string): Promise<ActionResult> {
  return swapFeatured(carId, 'down')
}

export async function markVerified(carId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cars')
    .update({ last_verified_at: new Date().toISOString() })
    .eq('id', carId)
  if (error) return failed('markVerified', error)
  revalidatePath('/admin')
  return { ok: true }
}

export async function updateCarStatus(
  carId: string,
  status: 'draft' | 'available' | 'reserved' | 'sold' | 'withdrawn',
  archiveReason?: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cars')
    .update({
      status,
      archive_reason: status === 'sold' || status === 'withdrawn' ? (archiveReason ?? null) : null,
    })
    .eq('id', carId)
  if (error) return failed('updateCarStatus', error)
  revalidatePath('/admin')
  revalidatePath('/admin/archive')
  revalidatePath('/')
  revalidatePath('/cars')
  return { ok: true }
}

// `<folder>/<file>.<ext>`, e.g. `3f2a…/9c1b….jpeg`. Anything else is not a
// car photo path and is ignored.
const CAR_IMAGE_PATH = /^[\w-]+\/[\w-]+\.\w+$/

// Removes photo files from Storage once nothing needs them. The caller deletes
// the car_images row first (or never created one); a leftover file is harmless,
// a broken image is not, so a failure here is logged and never thrown.
// Storage writes use the service role, so the owner check is done here, and a
// path any car_images row still points at is never removed.
export async function removeCarImageFiles(paths: string[]): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data: isOwner } = await supabase.rpc('is_owner')
    if (isOwner !== true) return

    const candidates = [...new Set(paths)].filter((path) => CAR_IMAGE_PATH.test(path))
    if (candidates.length === 0) return

    const { data: referenced, error: readError } = await supabase
      .from('car_images')
      .select('storage_path')
      .in('storage_path', candidates)
    if (readError) throw readError

    const inUse = new Set(referenced.map((row) => row.storage_path))
    const removable = candidates.filter((path) => !inUse.has(path))
    if (removable.length === 0) return

    const { error: removeError } = await createServiceClient().storage.from('car-images').remove(removable)
    if (removeError) throw removeError
  } catch (error) {
    console.error('[admin] removeCarImageFiles failed', error)
  }
}

// Hard delete. car_images, card_taps and whatsapp_clicks go with the car
// through ON DELETE CASCADE, and enquiries keep their rows with car_id set to
// null. The photo paths are read first because the cascade removes the rows
// that name them; the files go afterwards, best effort, so a Storage failure
// never undoes the delete.
export async function deleteCar(carId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }
  const { data: isOwner } = await supabase.rpc('is_owner')
  if (isOwner !== true) return { ok: false, error: 'Not authorised' }

  const { data: images, error: readError } = await supabase
    .from('car_images')
    .select('storage_path')
    .eq('car_id', carId)
  if (readError) return failed('deleteCar read', readError)

  // select() so a delete that matched nothing is reported, not silent.
  const { data: deleted, error: deleteError } = await supabase
    .from('cars')
    .delete()
    .eq('id', carId)
    .select('id')
  if (deleteError) return failed('deleteCar', deleteError)
  if (!deleted || deleted.length === 0) return failed('deleteCar', new Error(`No car deleted for ${carId}`))

  await removeCarImageFiles(images.map((image) => image.storage_path))

  revalidatePath('/admin')
  revalidatePath('/admin/archive')
  revalidatePath('/')
  revalidatePath('/cars')
  return { ok: true }
}
