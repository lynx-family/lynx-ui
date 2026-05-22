# luna-tokens

Design token definitions for the LUNA theme system. This package is the single source of truth for all color values. Token objects can be consumed directly in JavaScript/TypeScript. The `@lynx-js/luna-styles` and `@lynx-js/luna-tailwind` packages are compiled from this package and share the same version number.

## Design Concept

LUNA's color language is inspired by Lynx's Signature Gradient, a journey from strawberry skies to moonlit tides:

**Strawberry Milk · Rose Dusk · Moonlight Tides** — pinks leaning slightly toward orange, then to rose and lavender, ending in aqua and mint.

| Movement        | Color Range        | Character   |
| --------------- | ------------------ | ----------- |
| Strawberry Milk | Coral Pink → Rose  | Warm, soft  |
| Rose Dusk       | Lavender → Lilac   | Light, airy |
| Moonlight Tides | Blue → Aqua → Mint | Cool, fluid |

## Themes

LUNA provides four themes in two variants:

| Key             | Variant                      | Mode  |
| --------------- | ---------------------------- | ----- |
| `lunaris-dark`  | Lunaris (Signature Gradient) | Dark  |
| `lunaris-light` | Lunaris (Signature Gradient) | Light |
| `luna-dark`     | Luna (Neutral)               | Dark  |
| `luna-light`    | Luna (Neutral)               | Light |

### Lunaris — Signature Gradient

The brand expression theme. Lunaris carries the full gradient identity across its token values — suited for demos, marketing surfaces, and contexts where the visual identity should lead.

### Luna — Neutral

The default foundation. Luna is neutral and intentionally unopinionated — suited for product UI where the gradient would compete with content.

## Token Groups

### Surface

Surfaces form a layered system from background to foreground, defined by how they are perceived rather than by explicit elevation.

| Token            | Role                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| `canvas-ambient` | Deepest background, diffused, structural, below all content            |
| `canvas`         | Base surface, where interface begins                                   |
| `paper`          | Primary content surfaces such as cards and panels                      |
| `paper-clear`    | Floating surfaces that lift above `paper`, such as popovers and sheets |

Two translucent layers are derived from the canvas(background) direction. They dissolve a surface toward the environment — the surface recedes, blending into the background.

| Token        | Role                                                   |
| ------------ | ------------------------------------------------------ |
| `paper-veil` | Canvas-direction translucent layer, visibly present    |
| `paper-film` | Canvas-direction translucent layer, barely perceptible |

### Content

Solid color steps for text and icons, forming a presence scale from full-strength to decorative:

| Token            | Role                       |
| ---------------- | -------------------------- |
| `content`        | Primary text and icons     |
| `content-2`      | Secondary, one step softer |
| `content-muted`  | Supporting text            |
| `content-subtle` | Placeholder, disabled      |
| `content-faint`  | Near-invisible, decorative |

Semi-transparent variants for foreground elements. These describe the element's own reduction in presence — not a layer placed over something else.

| Token           | Role                             |
| --------------- | -------------------------------- |
| `content-faded` | Reduced presence, still readable |

### Primary

| Token                   | Role                                        |
| ----------------------- | ------------------------------------------- |
| `primary`               | Brand accent, interactive highlight         |
| `primary-2`             | Variant of `primary` used for active states |
| `primary-muted`         | Subdued primary, used for backgrounds       |
| `primary-content`       | Text/icons on top of primary                |
| `primary-content-faded` | Reduced-presence text/icons on primary      |

### Secondary

`secondary` and `neutral` do not have a `-muted` variant — both series are already positioned as receded tones within the system.

| Token                     | Role                                     |
| ------------------------- | ---------------------------------------- |
| `secondary`               | Supporting accent                        |
| `secondary-2`             | Softened variant of `secondary`          |
| `secondary-content`       | Text/icons on top of secondary           |
| `secondary-content-faded` | Reduced-presence text/icons on secondary |

### Neutral

The neutral series spans the full range from foreground to near-background, serving as the structural backbone of the interface. Unlike most systems where "neutral" is a limited grey scale for borders and disabled states, LUNA's neutral carries text, icons, fills, and spatial modifiers in a single coherent series.

| Token             | Role                                                   |
| ----------------- | ------------------------------------------------------ |
| `neutral`         | Full-weight neutral surface, inverse surface of canvas |
| `neutral-2`       | Slightly reduced neutral                               |
| `neutral-subtle`  | Mid-weight neutral                                     |
| `neutral-faint`   | Low-weight neutral                                     |
| `neutral-ambient` | Near-surface neutral fill                              |

Two translucent layers are derived from the neutral (foreground) direction. They push a surface toward presence — the surface becomes more distinct, more tangible.

| Token          | Role                                          |
| -------------- | --------------------------------------------- |
| `neutral-veil` | Foreground-direction translucent layer (~50%) |
| `neutral-film` | Foreground-direction translucent layer (~8%)  |

Content tokens for use on neutral surfaces:

| Token                   | Role                             |
| ----------------------- | -------------------------------- |
| `neutral-content`       | Text/icons on top of neutral     |
| `neutral-content-faded` | Reduced-presence text on neutral |

### Backdrop

Backdrop tokens are full-screen scrim overlays operating at the spatial layer between screens. Unlike `veil` and `film`, which modify surfaces, backdrop isolates the entire context.

| Token             | Role                                                    |
| ----------------- | ------------------------------------------------------- |
| `backdrop-subtle` | Light scrim — popovers, tooltips                        |
| `backdrop`        | Standard scrim — dialogs, sheets                        |
| `backdrop-heavy`  | Full-weight scrim — video backgrounds, critical dialogs |

### Lines

| Token  | Role                                                                     |
| ------ | ------------------------------------------------------------------------ |
| `line` | Thin, airy outlines around components such as buttons, inputs, and cards |
| `rule` | Dividers that separate regions, such as list items or sections           |

Use `line` to outline a component, and `rule` to separate one region from
another. The distinction is about role, not weight.

### Gradient

Gradient is a first-class color role in LUNA: the signature gradient is the visual origin of the system, not ornamentation applied after the fact.

| Token                                                  | Role                                             |
| ------------------------------------------------------ | ------------------------------------------------ |
| `gradient-a`, `gradient-b`, `gradient-c`, `gradient-d` | Gradient stop colors                             |
| `gradient-content`                                     | Text on gradient surfaces                        |
| `gradient-content-faded`                               | Reduced-presence text/icons on gradient surfaces |
| `gradient-content-trace`                               | Minimal-presence fill on gradient surfaces       |

## Naming Philosophy

LUNA's token names describe **perceptual states**, not spatial operations.

You will not find words like `raised`, `inset`, or `elevated` in this system. Those words describe what has been done to a surface — operations tied to a 2D stacking model.

Instead, LUNA names describe how surfaces are **perceived by the observer**.

The modifier scale reflects a continuous shift in presence:

- `clear` — perceptible, without visual noise or impurity
- `muted` — softened in intensity while still functional
- `subtle` — present, but intentionally quiet
- `faint` — at the threshold of perception
- `ambient` — diffused into the background, without boundary

These are not coordinates or instructions. They are conditions of presence.

Because of this, the naming system is not bound to flat interfaces. The same vocabulary applies to spatial environments, where depth is not measured in layers, but in how things emerge into perception.

## Modifier Scale

Token names follow a consistent perceptual scale across groups.
Modifiers describe how strongly a color or surface is perceived — not where it is placed.

### Solid presence

| Modifier   | Meaning                                                                      |
| ---------- | ---------------------------------------------------------------------------- |
| _(none)_   | Base, strongest presence                                                     |
| `-2`       | Second step within the same role (contextual) — the base token implies `-1`. |
| `-muted`   | Noticeably reduced, still functional                                         |
| `-subtle`  | Present, but intentionally quiet                                             |
| `-faint`   | Near the threshold of perception, decorative                                 |
| `-ambient` | Diffused into the background, without boundary                               |

### Translucent self-reduction (element's own presence diminished)

| Modifier | Meaning                                                                           |
| -------- | --------------------------------------------------------------------------------- |
| `-faded` | Reduced opacity, still readable, used for text and icons on colored surfaces      |
| `-trace` | Minimal residual signal — the lowest intentional presence, used for ghosted fills |

### Translucent coverage (placed over other surfaces)

| Modifier | Meaning                                              |
| -------- | ---------------------------------------------------- |
| `-veil`  | Semi-transparent layer (~50%), still visibly present |
| `-film`  | Near-transparent layer (~8%), barely perceptible     |

Veil and film exist in two polarities: the neutral direction
(`neutral-veil`, `neutral-film`) pushes a surface toward presence;
the paper direction (`paper-veil`, `paper-film`) dissolves it toward
the environment. These two polarities are not arbitrary — neutral and
paper/canvas share a coherent hue family and sit at opposite ends of
the foreground–background axis. Their veil/film layers inherit both
the hue affinity and the positional contrast.

## Installation

```bash
pnpm add @lynx-js/luna-tokens
```

## Usage

```typescript
import { lunarisDarkTokens, lunarisLightTokens } from '@lynx-js/luna-tokens';
import { lunaDarkTokens, lunaLightTokens } from '@lynx-js/luna-tokens';

const theme = lunarisDarkTokens;

theme.key; // "lunaris-dark"
theme.variant; // "lunaris"
theme.mode; // "dark"

const canvas = theme.colors['canvas'];
const paper = theme.colors['paper'];
const primary = theme.colors['primary'];
const contentMuted = theme.colors['content-muted'];
```

This package exports token objects directly. You will not typically need to import from this package unless you are building a custom theme.

For CSS Variable or Tailwind usage, see `@lynx-js/luna-styles` and `@lynx-js/luna-tailwind`.

## LUNA Packages

- `@lynx-js/luna-tokens` — source of truth for token values (this package)
- `@lynx-js/luna-core` — token and theme type definitions
- `@lynx-js/luna-styles` — CSS variables output
- `@lynx-js/luna-tailwind` — Tailwind utilities output
- `@lynx-js/luna-reactlynx` — ReactLynx runtime integration
