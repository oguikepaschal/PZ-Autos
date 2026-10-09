'use client'

import { useEffect, useRef } from 'react'
import { removeCarImageFiles } from '@/app/admin/actions'

// Photos upload as soon as they are picked, but only get a car_images row when
// the form saves. If the admin leaves the form inside the app without saving,
// the files uploaded in this session would be left in Storage with nothing
// pointing at them, so they are removed on the way out. Best effort: it never
// blocks navigation, and closing the tab or app is not covered.
//
// `unsavedPaths` is every photo currently on the form that has no row yet.
// Call the returned function once the save has succeeded.
export function useDiscardUnsavedPhotos(unsavedPaths: string[]): () => void {
  const latest = useRef(unsavedPaths)
  const saved = useRef(false)

  useEffect(() => {
    latest.current = unsavedPaths
  })

  useEffect(
    () => () => {
      if (saved.current || latest.current.length === 0) return
      void removeCarImageFiles(latest.current).catch(() => {})
    },
    []
  )

  return () => {
    saved.current = true
  }
}
