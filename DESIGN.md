---
name: PZ Autos
description: Car dealership inventory and enquiry site
colors:
  ink: "#141414"
  signal-red: "#d0121b"
  bg-base: "#ffffff"
  body-text: "#262626"
  text-on-dark: "#a3a3a3"
  text-muted: "#5c5c5c"
  hairline: "#e5e5e5"
typography:
  display:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
  body:
    fontFamily: "Barlow, Helvetica, Arial, sans-serif"
rounded:
  default: "8px"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.signal-red}"
    textColor: "#ffffff"
    rounded: "{rounded.default}"
    padding: "12px 24px"
  input-default:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.ink}"
    rounded: "{rounded.default}"
---

# Design System: PZ Autos

## Overview

A functional car-dealership inventory site: ink-black type on a white base, with signal red reserved for exactly one call-to-action or accent per screen. The codebase enforces this itself — inline comments at several call sites explicitly reject signal red in favor of ink ("Ink, not a signal-red fill", "red is a one-per-screen accent") and status badges are deliberately never red, using ink or muted text instead. The result reads as restrained and utilitarian rather than decorative: no shadows beyond two default Tailwind utilities, no gradients, no secondary accent color.

**Key Characteristics:**
- Two typefaces, one role each: Archivo for display/wordmark, Barlow for everything else.
- One accent color (signal red), applied narrowly and by convention, not by a system-enforced budget.
- Flat surfaces, hairline borders, `rounded-lg` as the default corner radius.

## Colors

Three intentional colors plus a neutral scale for text and borders.

### Primary
- **Ink** (`#141414`): default text and body copy color source (`--ink`, `--body-text` is a slightly softened `#262626` for running copy); also the default status-badge color for "Reserved" listings, standing in for a color specifically so status never reads as red.

### Secondary
- **Signal Red** (`#d0121b`): the single accent. Used only on primary CTA buttons (submit/enquire/save actions) and matching inline text emphasis (error messages). Never used for status or decoration.

### Neutral
Every grey is neutral (equal R, G and B), never blue-tinted.

- **White** (`#ffffff`): page background (`--bg-base`).
- **Body Text** (`#262626`): running copy, slightly softer than pure ink.
- **Text on Dark** (`#a3a3a3`): muted text for dark surfaces.
- **Text Muted** (`#5c5c5c`): secondary/disabled text, also the "Sold" status color.
- **Hairline** (`#e5e5e5`): borders and dividers — the dominant border treatment (35 of 38 `border` usages).

### Named Rules
**The One Accent Rule.** Signal red is the only accent color and appears on at most one primary action or emphasis per screen. Status indicators never use it, even where a system might default an urgent/negative state to red — "Sold" and "Reserved" both render in ink or muted tones instead.

## Typography

**Display Font:** Archivo (with Helvetica, Arial, sans-serif fallback)
**Body Font:** Barlow (with Helvetica, Arial, sans-serif fallback)

**Character:** Both are loaded via `next/font/google` with no other typeface in the codebase.

## Layout

Public pages align to one container, the `container-page` utility in `app/globals.css` (1200px max, 20px gutters, 32px from 768px up). Type, spacing and motion steps live in the `@theme` block there: fluid `text-h1`/`text-h2`/`text-h3`, `text-lead`, `text-body`, `text-small`, `text-caption`, `tracking-display`, `max-w-measure` (65ch) and `py-section`. Standard control padding is `px-3 py-2` (inputs) and `px-4 py-2` to `px-6 py-3.5` (buttons, scaling with prominence).

## Elevation & Depth

Flat by default. Only two `shadow-*` utilities exist in the entire codebase (`shadow-sm` on a toggle knob, `shadow-lg` on one dropdown/combobox panel) — both stock Tailwind defaults, not a custom shadow scale. Depth and separation are conveyed with hairline borders, not shadows.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat. A shadow appears only on a floating/overlay element (a dropdown panel) or a toggle control, never as general card or button styling.

## Shapes

`rounded-lg` (8px) is the default radius for buttons, inputs, cards, and panels (38 of 57 rounding utilities). `rounded-full` is used for pills and toggle knobs; `rounded-xl` appears occasionally on larger containers. No sharp-cornered (radius-0) components were found.

## Components

### Buttons
- **Shape:** `rounded-lg` (8px)
- **Primary:** `bg-signal-red text-white font-body font-semibold`, padding scales from `px-4 py-2` (compact) to `px-6 py-3.5` (hero); `disabled:opacity-60` on form-submit buttons.
- **Secondary/Ghost:** not consistently themed in the scanned surfaces — no distinct secondary button pattern was found to document.

### Cards / Containers
- **Corner style:** `rounded-lg`, occasionally `rounded-xl`.
- **Background:** white, with `border-hairline` as the separating treatment.
- **Shadow strategy:** none by default; see Elevation & Depth.

### Inputs / Fields
- **Style:** `border border-hairline rounded-lg px-3 py-2 font-body text-sm text-ink` — this exact pattern repeats across every scanned form.
- **Error state:** `text-signal-red`, `text-xs` or `text-sm`, placed directly below the field.

### Navigation
Not scanned in this pass — no dedicated nav component was inspected for this run.

## Do's and Don'ts

### Do:
- **Do** reserve signal red (`#d0121b`) for one primary action or emphasis per screen.
- **Do** use `border-hairline` for separation instead of shadows.
- **Do** use `rounded-lg` as the default corner radius for buttons, inputs, and cards.
- **Do** keep all UI animation at or under 300ms using `cubic-bezier(0.23, 1, 0.32, 1)`; reserve 500–800ms only for a rare focal entrance on a marketing surface (e.g. the listing-page hero), never on hover, press, toggles, modals, menus, lists, or navigation. (See CLAUDE.md, Animation timing — that rule is authoritative and overrides this file if the two ever diverge.)

### Don't:
- **Don't** use signal red for status indicators (Reserved/Sold) — both use ink or muted text instead.
- **Don't** introduce a third typeface; Archivo and Barlow cover every documented use, including per-make stylistic variation.
- **Don't** add shadows to cards or buttons as a default treatment; shadows are reserved for floating/overlay elements only.
