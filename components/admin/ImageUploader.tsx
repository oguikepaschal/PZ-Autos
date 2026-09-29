'use client'

import { useRef, useState } from 'react'
import { Plus, X, Star } from 'lucide-react'
import { uploadCarImage, deleteCarImage } from '@/lib/supabase/storage'
import { cn } from '@/lib/utils'

export interface PendingImage {
  storagePath: string
  publicUrl: string
  isCover: boolean
}

interface ImageUploaderProps {
  folderId: string
  images: PendingImage[]
  onChange: (images: PendingImage[]) => void
}

export function ImageUploader({ folderId, images, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)

    try {
      const uploaded: PendingImage[] = []
      for (const file of Array.from(files)) {
        const { storagePath, publicUrl } = await uploadCarImage(folderId, file)
        uploaded.push({ storagePath, publicUrl, isCover: false })
      }

      const next = [...images, ...uploaded]
      // First photo ever uploaded defaults to cover so a car is never left
      // without one.
      if (!next.some((img) => img.isCover) && next.length > 0) {
        next[0] = { ...next[0]!, isCover: true }
      }
      onChange(next)
    } catch {
      setError('Some photos failed to upload. Try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove(index: number) {
    const target = images[index]
    if (!target) return
    const next = images.filter((_, i) => i !== index)
    if (target.isCover && next.length > 0) next[0] = { ...next[0]!, isCover: true }
    onChange(next)
    try {
      await deleteCarImage(target.storagePath)
    } catch {
      // Best-effort — an orphaned object here is cleaned up manually later;
      // it's not linked to any car row either way.
    }
  }

  function handleSetCover(index: number) {
    onChange(images.map((img, i) => ({ ...img, isCover: i === index })))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div
            key={image.storagePath}
            className="relative size-28 rounded-lg overflow-hidden border border-hairline"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.publicUrl} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleSetCover(index)}
              aria-label="Set as cover photo"
              className="absolute top-0 left-0 flex size-11 items-center justify-center text-white"
            >
              {/* The 44px button is the tap target; the circle is only the visual. */}
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full',
                  image.isCover ? 'bg-signal-red' : 'bg-black/50'
                )}
              >
                <Star size={14} fill={image.isCover ? 'currentColor' : 'none'} />
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              aria-label="Remove photo"
              className="absolute top-0 right-0 flex size-11 items-center justify-center text-white"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-black/50">
                <X size={14} />
              </span>
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Add photos"
          className="size-28 rounded-lg border border-dashed border-hairline flex items-center justify-center text-text-muted disabled:opacity-50"
        >
          {uploading ? '…' : <Plus size={20} />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="font-body text-small text-signal-red mt-2">{error}</p>}
      <p className="font-body text-small text-text-muted mt-2">
        Tap the star to set the cover photo. Photos are compressed and stripped of location
        metadata automatically.
      </p>
    </div>
  )
}
