import { createPublicClient } from '@/lib/supabase/publicClient'
import { getShowcaseImageUrl } from '@/lib/images'
import type { PublicCar, PublicCarImage, PublicCarCardData, PublicCarWithImages } from './types'

// Every read here goes through the anon-key client against the public_*
// views — never the base tables. That's what keeps supplier identity and
// cost price structurally unreachable from this code path, not just
// unused by it.

export async function getPublicCars(): Promise<PublicCarCardData[]> {
  const supabase = createPublicClient()

  const { data: cars, error: carsError } = await supabase
    .from('public_cars_view')
    .select('*')
    .order('created_at', { ascending: false })

  if (carsError) throw carsError
  if (!cars || cars.length === 0) return []

  const { data: images, error: imagesError } = await supabase
    .from('public_car_images_view')
    .select('*')
    .eq('is_cover', true)

  if (imagesError) throw imagesError

  const coverByCarId = new Map<string, string>()
  for (const image of (images ?? []) as PublicCarImage[]) {
    coverByCarId.set(image.car_id, getShowcaseImageUrl(image.storage_path))
  }

  return (cars as PublicCar[]).map((car) => ({
    ...car,
    coverImageUrl: coverByCarId.get(car.id) ?? null,
  }))
}

export async function getFeaturedCars(): Promise<PublicCarCardData[]> {
  const supabase = createPublicClient()

  const { data: cars, error: carsError } = await supabase
    .from('public_featured_cars_view')
    .select('*')

  if (carsError) throw carsError
  if (!cars || cars.length === 0) return []

  const carIds = (cars as PublicCar[]).map((c) => c.id)

  const { data: images, error: imagesError } = await supabase
    .from('public_car_images_view')
    .select('*')
    .in('car_id', carIds)
    .eq('is_cover', true)

  if (imagesError) throw imagesError

  const coverByCarId = new Map<string, string>()
  for (const image of (images ?? []) as PublicCarImage[]) {
    coverByCarId.set(image.car_id, getShowcaseImageUrl(image.storage_path))
  }

  return (cars as PublicCar[]).map((car) => ({
    ...car,
    coverImageUrl: coverByCarId.get(car.id) ?? null,
  }))
}

export async function getPublicCarBySlug(slug: string): Promise<PublicCarWithImages | null> {
  const supabase = createPublicClient()

  const { data: car, error: carError } = await supabase
    .from('public_cars_view')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (carError) throw carError
  if (!car) return null

  const { data: images, error: imagesError } = await supabase
    .from('public_car_images_view')
    .select('*')
    .eq('car_id', (car as PublicCar).id)
    .order('sort_order', { ascending: true })

  if (imagesError) throw imagesError

  return {
    ...(car as PublicCar),
    images: (images ?? []) as PublicCarImage[],
  }
}
