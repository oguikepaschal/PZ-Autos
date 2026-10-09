'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
