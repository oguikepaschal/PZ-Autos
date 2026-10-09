'use client'

import { useEffect, useId, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  // Cancel, Escape, the back gesture and a tap on the scrim all call this.
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  hint?: string
  confirmLabel: string
  pending?: boolean
  error?: string | null
}

// A native modal <dialog>, like ActionSheet: it traps focus, returns focus to
// the opener, and turns Escape and Android's back gesture into a cancel.
// Cancel takes focus when it opens, so a stray Enter never confirms.
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  hint,
  confirmLabel,
  pending = false,
  error,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      cancelRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  function cancel() {
    if (!pending) onClose()
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        cancel()
      }}
      // The browser can close a modal without a cancelable cancel (Android
      // back with no recent user activation); keep the parent's state in step.
      onClose={() => {
        if (open) cancel()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) cancel()
      }}
      className="m-auto w-[calc(100%-32px)] max-w-sm rounded-[22px] bg-surface p-5 text-ink backdrop:bg-surface-dark/50"
    >
      <h2 id={titleId} className="font-body text-[17px] font-semibold leading-snug">
        {title}
      </h2>
      <p className="mt-2 font-body text-[15px] leading-snug text-text-muted">{description}</p>
      {error && (
        <p role="alert" className="mt-3 font-body text-[15px] font-semibold">
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-2">
        <button
          ref={cancelRef}
          type="button"
          onClick={cancel}
          disabled={pending}
          className="min-h-12 flex-1 rounded-[14px] bg-fill font-body text-[17px] font-semibold text-ink active:opacity-80 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="min-h-12 flex-1 rounded-[14px] bg-signal-red font-body text-[17px] font-semibold text-white active:opacity-80 disabled:opacity-60"
        >
          {pending ? 'Deleting…' : confirmLabel}
        </button>
      </div>
      {hint && <p className="mt-3 text-center font-body text-[13px] text-text-muted">{hint}</p>}
    </dialog>
  )
}
