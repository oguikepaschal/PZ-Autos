import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CarEditForm } from '@/components/admin/CarEditForm'
import type { Car, CarImage, Supplier } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCarPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: car } = await supabase
    .from('cars')
    .select('*, whatsapp_clicks(count)')
    .eq('id', id)
    .maybeSingle()
  if (!car) notFound()

  const [{ data: images }, { data: suppliers }, { data: featured }] = await Promise.all([
    supabase.from('car_images').select('*').eq('car_id', id).order('sort_order', { ascending: true }),
    supabase
      .from('suppliers')
      .select('id, name, supplier_type')
      .or(`is_active.eq.true,id.eq.${car.supplier_id}`)
      .order('name'),
    // The home page order, for this car's position and the arrows' ends.
    supabase.from('cars').select('id').eq('is_featured', true).order('featured_order', { ascending: true }),
  ])

  const { whatsapp_clicks: clicks, ...typedCar } = car as Car & { whatsapp_clicks: { count: number }[] }
  const featuredIds = (featured ?? []).map((c) => c.id as string)

  return (
    <CarEditForm
      car={typedCar}
      images={(images ?? []) as CarImage[]}
      suppliers={(suppliers ?? []) as Pick<Supplier, 'id' | 'name' | 'supplier_type'>[]}
      whatsappTaps={clicks[0]?.count ?? 0}
      featuredIndex={featuredIds.indexOf(typedCar.id)}
      featuredCount={featuredIds.length}
    />
  )
}
