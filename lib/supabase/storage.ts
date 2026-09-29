import { createClient } from '@/lib/supabase/client'
import { getCarImagePublicUrl } from '@/lib/images'
import compressImage from 'browser-image-compression'

const BUCKET = 'car-images'
const MAX_SIZE_MB = 1.5
const MAX_WIDTH_PX = 1920

// Photos are taken on a supplier's premises — an embedded geotag or other
// EXIF resolves to their address regardless of what the database returns.
// browser-image-compression re-encodes through a <canvas>, which drops all
// EXIF (GPS included) as a side effect of the re-encode; we never opt in to
// its `preserveExif` option. This is verified against a real geotagged test
// photo as part of Phase 2 QA (see project DoD) — do not rely on this
// comment alone as proof.
const COMPRESSION_OPTIONS = {
  maxSizeMB: MAX_SIZE_MB,
  maxWidthOrHeight: MAX_WIDTH_PX,
  useWebWorker: true,
}

export interface UploadedCarImage {
  storagePath: string
  publicUrl: string
}

// `folderId` namespaces the Storage path and isn't required to be a real
// car id — the admin "Add car" flow uploads photos before the car row
// exists, so it passes a temporary id (crypto.randomUUID()) per draft. The
// path is never derived from the supplier or file name — see the schema
// migration's note on why (a filename can itself be identifying).
export async function uploadCarImage(folderId: string, file: File): Promise<UploadedCarImage> {
  let compressed: File = file
  try {
    compressed = await compressImage(file, COMPRESSION_OPTIONS)
  } catch (compressionError) {
    console.warn('Image compression failed, uploading original file:', compressionError)
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storagePath = `${folderId}/${crypto.randomUUID()}.${ext}`
  const contentType = compressed.type || file.type || 'image/jpeg'

  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, compressed, {
    contentType,
    upsert: false,
  })

  if (error) {
    console.error('Storage upload error:', JSON.stringify(error))
    throw error
  }

  return { storagePath, publicUrl: getCarImagePublicUrl(storagePath) }
}

export async function deleteCarImage(storagePath: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (error) throw error
}

// Deletes every object under a folder prefix. Used to clean up
// already-uploaded photos when car creation fails after the upload step —
// Storage writes aren't part of the DB transaction, so this compensating
// delete is what keeps a failed creation from leaving orphaned files.
export async function deleteCarImagesByPrefix(folderId: string): Promise<void> {
  const supabase = createClient()
  const { data: files, error: listError } = await supabase.storage.from(BUCKET).list(folderId)
  if (listError) {
    console.error('Failed to list orphaned images for cleanup:', listError)
    return
  }
  if (!files || files.length === 0) return

  const paths = files.map((f) => `${folderId}/${f.name}`)
  const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths)
  if (removeError) {
    console.error('Failed to delete orphaned images:', removeError)
  }
}

export type NewCarPayload = {
  slug: string
  supplier_id: string
  make: string
  model: string
  year: number
  trim?: string | null
  body_type?: string | null
  transmission?: string | null
  fuel_type?: string | null
  mileage_km?: number | null
  exterior_colour?: string | null
  interior_colour?: string | null
  engine_layout?: string | null
  drivetrain?: string | null
  condition?: string | null
  description?: string | null
  key_features?: string[] | null
  location_area?: string | null
  vin?: string | null
  registration_plate?: string | null
  cost_price_ngn?: number | null
  asking_price_ngn: number
  status?: 'draft' | 'available' | 'reserved'
  acquisition_notes?: string | null
}

export type NewCarImagePayload = {
  storage_path: string
  alt_text?: string | null
  is_cover: boolean
  sort_order: number
}

// Car creation must be atomic at the DB level (one RPC, one transaction —
// see supabase/migrations/20260902000003_rpc_functions.sql) and must never
// leave orphaned Storage objects when it fails. The RPC guarantees the
// first half; this function guarantees the second by deleting whatever was
// already uploaded under `folderId` if the RPC throws.
export async function createCarWithImages(
  folderId: string,
  car: NewCarPayload,
  images: NewCarImagePayload[]
): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('create_car_with_images', {
    p_car: car,
    p_images: images,
  })

  if (error) {
    await deleteCarImagesByPrefix(folderId)
    throw error
  }

  return data as string
}
