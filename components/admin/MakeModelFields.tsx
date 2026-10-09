'use client'

import { useRef } from 'react'
import { Combobox } from './Combobox'
import { Row, rowControlClass } from './FormRows'
import { CAR_MAKES, CAR_MAKES_WITH_MODELS } from '@/lib/carOptions'

interface MakeModelFieldsProps {
  make: string
  model: string
  variant: string
  trim: string
  onMakeChange: (make: string) => void
  onModelChange: (model: string) => void
  onVariantChange: (variant: string) => void
  onTrimChange: (trim: string) => void
}

// Model suggestions are scoped to the selected Make; an unrecognised Make
// (broker-sourced inventory isn't limited to CAR_MAKES) just falls back to
// no suggestions, and Model stays free entry either way. Model isn't cleared
// on a Make change the user didn't just make (e.g. loading an existing
// car's saved make/model) — only once Make actually changes after mount.
// Variant and Trim are optional plain text with no suggestions.
export function MakeModelFields({
  make,
  model,
  variant,
  trim,
  onMakeChange,
  onModelChange,
  onVariantChange,
  onTrimChange,
}: MakeModelFieldsProps) {
  const previousMake = useRef(make)
  const modelOptions = CAR_MAKES_WITH_MODELS[make] ?? []

  function handleMakeChange(nextMake: string) {
    if (nextMake !== previousMake.current) {
      onModelChange('')
    }
    previousMake.current = nextMake
    onMakeChange(nextMake)
  }

  return (
    <>
      <Row label="Make">
        <Combobox
          name="make"
          value={make}
          onChange={handleMakeChange}
          options={CAR_MAKES}
          placeholder="Toyota"
          emptyHint="No match — this make will be saved as typed"
        />
      </Row>
      <Row label="Model">
        <Combobox
          name="model"
          value={model}
          onChange={onModelChange}
          options={modelOptions}
          placeholder={modelOptions.length ? 'Camry' : 'Type the model'}
          emptyHint="No match — this model will be saved as typed"
        />
      </Row>
      <Row label="Variant">
        <input
          name="variant"
          autoComplete="off"
          value={variant}
          onChange={(e) => onVariantChange(e.target.value)}
          placeholder="e.g. 350"
          className={rowControlClass}
        />
      </Row>
      <Row label="Trim">
        <input
          name="trim"
          autoComplete="off"
          value={trim}
          onChange={(e) => onTrimChange(e.target.value)}
          placeholder="e.g. XSE"
          className={rowControlClass}
        />
      </Row>
    </>
  )
}
