---
name: PZ Autos
description: Car dealership inventory and enquiry site, and its admin app
colors:
  bg-base: "#F2F2F4"
  surface: "#FFFFFF"
  ink: "#141414"
  text-muted: "#5B5B60"
  ink-3: "#AEAEB2"
  hairline: "rgba(20,20,20,0.08)"
  fill: "rgba(20,20,20,0.05)"
  signal-red: "#D0121B"
  surface-dark: "#141414"
  text-on-dark: "#A1A1A6"
colors-dark:
  bg-base: "#000000"
  surface: "#1C1C1E"
  ink: "#F5F5F7"
  text-muted: "#A1A1A6"
  ink-3: "#636366"
  hairline: "rgba(255,255,255,0.10)"
  fill: "rgba(255,255,255,0.09)"
  signal-red: "#F0323A"
  surface-dark: "#141414"
  text-on-dark: "#A1A1A6"
typography:
  display:
    fontFamily: "Archivo, Helvetica, Arial, sans-serif"
  body:
    fontFamily: "Barlow, Helvetica, Arial, sans-serif"
rounded:
  control: "9999px"
  card: "20px"
  group: "16px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
---

# Design System: PZ Autos

## Overview

A phone-first car showcase and its admin app, styled after native iOS: a soft grey page, white cards, ink type, and floating glass controls. The theme follows the system light or dark setting, with no toggle. Signal red is a small accent with a fixed list of uses, and status never reads as red.

**Key Characteristics:**
- Two typefaces, one role each: Archivo for display (800 for titles, -0.02em tracking), Barlow for everything else.
- One accent colour, signal red, limited to the uses listed below.
- Flat cards on a grey page; one glass treatment for everything that floats.

## Colors

All tokens live in `app/globals.css` as CSS variables, with dark values under `prefers-color-scheme: dark` (and under `.scheme-dark`, which forces dark inside the photo viewer). No colour outside these tokens is used.

### Light and dark
| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `bg-base` | `#F2F2F4` | `#000000` | Page background |
| `surface` | `#FFFFFF` | `#1C1C1E` | Cards and grouped rows |
| `ink` | `#141414` | `#F5F5F7` | Text, primary button fill |
| `text-muted` | `#5B5B60` | `#A1A1A6` | Secondary text |
| `ink-3` | `#AEAEB2` | `#636366` | Glyphs, inactive dots, switch off track. Never text. |
| `hairline` | `rgba(20,20,20,.08)` | `rgba(255,255,255,.10)` | Separators |
| `fill` | `rgba(20,20,20,.05)` | `rgba(255,255,255,.09)` | Chips, search field, placeholders |
| `signal-red` | `#D0121B` | `#F0323A` | See the red rules |

### Always dark
- **Surface Dark** (`#141414` in both themes): the public header, footer, landing hero and the Sold pill. Text on it is white or **Text on Dark** (`#A1A1A6`).

### Glass
One `glass` utility in `app/globals.css` for every floating control: the admin tab bar, the top and bottom form bars, the round photo buttons, the WhatsApp pill and the viewer controls.
- Light: background `rgba(255,255,255,.58)`, border `rgba(255,255,255,.8)`, shadow `0 12px 32px rgba(20,20,20,.16)` plus `inset 0 1px 0 rgba(255,255,255,.9)`.
- Dark: background `rgba(44,44,46,.55)`, border `rgba(255,255,255,.14)`, shadow `0 12px 32px rgba(0,0,0,.55)` plus `inset 0 1px 0 rgba(255,255,255,.10)`.
- Blur: `blur(24px) saturate(180%)`, with the `-webkit-` prefix. Dark glass adds `brightness(.75)` so light text keeps 4.5:1 over a white photo.
- Under `prefers-reduced-transparency: reduce` it becomes a solid surface with no blur; under `prefers-contrast: more`, solid with an ink border.

### Named Rules
**The Red Rule.** Signal red appears only on: the active admin tab, cover and featured stars, the featured switch, the WhatsApp icon, the INVENTORY kicker, and error messages (always with an error icon). Primary buttons are ink filled. Status indicators are never red. Red stays at or under 5% of the visual weight of any screen.

**Red Text Placement.** Red error text sits on the page background, where it keeps 4.5:1 in both themes. Inside a card, an error uses ink text with a red icon, because dark-mode red on the dark card is under 4.5:1.

## Typography

**Display Font:** Archivo 700/800 (with Helvetica, Arial, sans-serif fallback). Titles use 800 with -0.02em tracking.
**Body Font:** Barlow 400/600 (with Helvetica, Arial, sans-serif fallback).

Every input is 16px or larger so iOS never zooms on focus.

## Layout

Public pages align to one container, the `container-page` utility in `app/globals.css` (1200px max, 20px gutters, 32px from 768px up). Below md, admin screens draw their own top (a large title, a glass bar, or a full-bleed photo) and the always-dark header returns from md up. Every tap target is at least 44px.

## Elevation & Depth

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat. A shadow appears only on a floating/overlay element (glass controls, a dropdown panel, a sheet) or a toggle control, never as general card or button styling.

## Shapes

Cards are 20–22px rounded, grouped rows 16px, controls fully rounded (pills and circles).

## Components

- **Primary button:** ink fill, `ink-inverse` text, fully rounded, 44–52px tall.
- **Secondary button:** `fill` background, ink text.
- **Grouped rows (admin forms):** 52px rows on a `surface` group, label left and native control right, inset hairlines between rows. The locked "Only you see this" group holds every admin-only field.
- **Action sheet:** a native modal `<dialog>` that rises from the bottom over a dimming scrim.
- **Segmented control:** native radios on a `fill` track; the selected segment uses the `segment` token.

## Motion

All UI animation stays at or under 300ms on `cubic-bezier(0.23, 1, 0.32, 1)`, including the sheet, the switch and the photo viewer's grow and shrink. 500–800ms is allowed only for a rare focal entrance on a marketing surface, never on repeated interactions. CLAUDE.md, Animation timing, is authoritative. Reduced motion swaps movement for a short fade, and the /cars carousel starts paused.

## Do's and Don'ts

### Do:
- **Do** use the tokens above and nothing else.
- **Do** use the one `glass` utility for anything that floats.
- **Do** keep red to the uses in the Red Rule.

### Don't:
- **Don't** use signal red for status indicators or primary buttons.
- **Don't** put red text on a dark-mode card.
- **Don't** introduce a third typeface.
- **Don't** add shadows to cards or buttons as a default treatment.
