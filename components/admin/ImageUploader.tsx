'use client'

import { useRef, useState } from 'react'
import { AlertCircle, Plus, X, Star } from 'lucide-react'
import { uploadCarImage, deleteCarImage } from '@/lib/supabase/storage'

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
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="font-body text-[13px] font-semibold uppercase tracking-[0.06em] text-text-muted">Photos</h2>
        {images.length > 0 && (
          <span className="font-body text-[13px] text-text-muted">{images.length} selected</span>
        )}
      </div>
      <ul className="grid grid-cols-3 gap-2">
        {images.map((image, index) => (
          <li key={image.storagePath} className="relative aspect-square overflow-hidden rounded-[14px] bg-fill">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.publicUrl} alt={`Photo ${index + 1}`} className="size-full object-cover" />
            {/* Each 44px button is the hit area; the glass circle is the visual. */}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              aria-label={`Remove photo ${index + 1}`}
              className="absolute top-0 left-0 flex size-11 items-center justify-center"
            >
              <span className="glass flex size-7 items-center justify-center rounded-full text-ink">
                <X size={14} strokeWidth={2.2} aria-hidden="true" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleSetCover(index)}
              aria-pressed={image.isCover}
              aria-label={image.isCover ? `Photo ${index + 1} is the cover` : `Set photo ${index + 1} as cover`}
              className="absolute top-0 right-0 flex size-11 items-center justify-center"
            >
              <span className="glass flex size-7 items-center justify-center rounded-full">
                <Star
                  size={15}
                  strokeWidth={1.8}
                  aria-hidden="true"
                  className={image.isCover ? 'fill-signal-red text-signal-red' : 'text-ink'}
                />
              </span>
            </button>
            {image.isCover && (
              <span className="glass absolute bottom-2 left-2 rounded-full px-2 py-0.5 font-body text-xs font-semibold text-ink">
                Cover
              </span>
            )}
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[14px] border-[1.5px] border-dashed border-ink-3 font-body text-[13px] font-semibold text-ink disabled:opacity-60"
          >
            <Plus size={22} strokeWidth={2} aria-hidden="true" />
            {uploading ? 'Uploading…' : 'Add'}
          </button>
        </li>
      </ul>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && (
        <p role="alert" className="flex items-start gap-2 px-1 font-body text-[15px] font-semibold text-signal-red">
          <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
      <p className="px-1 font-body text-[13px] leading-snug text-text-muted">
        Tap a star to choose the cover. Photos are compressed and location data is removed on upload.
      </p>
    </section>
  )
}
