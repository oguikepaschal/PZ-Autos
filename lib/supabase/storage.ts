import { createClient } from '@/lib/supabase/client'
import { getCarImagePublicUrl } from '@/lib/images'
import compressImage from 'browser-image-compression'

const BUCKET = 'car-images'
const MAX_SIZE_MB = 1.5
const MAX_WIDTH_PX = 1920
const JPEG_TYPE = 'image/jpeg'

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
  fileType: JPEG_TYPE,
}

const HEIC_BRANDS = new Set(['heic', 'heix', 'mif1'])

const PHOTO_PROCESSING_MESSAGE =
  'This photo could not be processed. Try another photo or export it as JPEG.'

// Thrown when a photo cannot be turned into a compressed JPEG. Callers skip
// that photo; nothing is stored for it.
export class PhotoProcessingError extends Error {
  constructor() {
    super(PHOTO_PROCESSING_MESSAGE)
    this.name = 'PhotoProcessingError'
  }
}

export interface UploadedCarImage {
  storagePath: string
  publicUrl: string
}

// iOS sometimes reports an empty or generic type for HEIC, so the MIME type
// alone isn't enough: also check the extension and the ISO-BMFF `ftyp` header
// (bytes 4-8 are "ftyp", bytes 8-12 the major brand).
async function isHeicFile(file: File): Promise<boolean> {
  if (/^image\/hei[cf]$/i.test(file.type)) return true
  if (/\.hei[cf]$/i.test(file.name)) return true
  try {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    const ascii = (from: number, to: number) => String.fromCharCode(...header.slice(from, to))
    return ascii(4, 8) === 'ftyp' && HEIC_BRANDS.has(ascii(8, 12))
  } catch {
    return false
  }
}

async function compressToJpeg(file: File): Promise<File> {
  const compressed = await compressImage(file, COMPRESSION_OPTIONS)
  // A browser that can't encode the requested type silently falls back to
  // PNG, so the output is checked rather than assumed.
  if (compressed.type !== JPEG_TYPE) throw new Error(`Unexpected output type: ${compressed.type}`)
  return compressed
}

// Only a successfully compressed JPEG is ever returned — there is no
// fall-back to the original file. Safari can usually decode HEIC natively, so
// plain compression is tried first; other browsers get a HEIC -> JPEG
// conversion first, with the decoder loaded only at that moment.
async function processPhoto(file: File): Promise<File> {
  try {
    return await compressToJpeg(file)
  } catch (compressionError) {
    if (!(await isHeicFile(file))) {
      console.warn('Image compression failed:', compressionError)
      throw new PhotoProcessingError()
    }
  }

  try {
    const { heicTo } = await import('heic-to')
    const jpeg = await heicTo({ blob: file, type: JPEG_TYPE })
    return await compressToJpeg(new File([jpeg], 'photo.jpg', { type: JPEG_TYPE }))
  } catch (conversionError) {
    console.warn('HEIC conversion failed:', conversionError)
    throw new PhotoProcessingError()
  }
}

// `folderId` namespaces the Storage path and isn't required to be a real
// car id — the admin "Add car" flow uploads photos before the car row
// exists, so it passes a temporary id (crypto.randomUUID()) per draft. The
// path is never derived from the supplier or file name — see the schema
// migration's note on why (a filename can itself be identifying). The
// extension and content type describe the compressed output, not the input.
export async function uploadCarImage(folderId: string, file: File): Promise<UploadedCarImage> {
  const jpeg = await processPhoto(file)
  const storagePath = `${folderId}/${crypto.randomUUID()}.jpg`

  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, jpeg, {
    contentType: JPEG_TYPE,
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
