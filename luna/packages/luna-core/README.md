# luna-core

The foundational types package for the LUNA theming system. It provides theme types, color ID/key constants and conversion utilities, and theme resolution (resolver) APIs.

This package does not ship any concrete color values. Color values live in `@lynx-js/luna-tokens` as the single source of truth.

## Installation

```bash
pnpm add @lynx-js/luna-core
```

## What’s Inside

- Theme keys: `LunaThemeKey` / `LunaThemeVariant` / `LunaThemeMode`, plus extensible custom space via `LunaCustomThemeKey`
- Theme token types: `LunaThemeTokens` / `LunaCustomThemeTokens` / `LunaCustomThemeMeta`
- Color system: `LunaColorId` (kebab-case), `LunaColorKey` (camelCase), `LUNA_COLOR_IDS` / `LUNA_COLOR_KEYS`, and `colorIdToColorKey` / `colorKeyToColorId`
- Theme resolver: `resolveThemeKeyFromList` / `resolveThemeObjectFromList` / `inferThemeMode`

## Usage

### Pair With Tokens (Get Concrete Color Values)

```ts
import type { LunaThemeTokens } from '@lynx-js/luna-core'
import { lunarisDarkTokens } from '@lynx-js/luna-tokens'

const theme: LunaThemeTokens = lunarisDarkTokens

const primary = theme.colors['primary']
const contentMuted = theme.colors['content-muted']
```

### ColorId / ColorKey

`LunaColorId` is the color id used in tokens (kebab-case), e.g. `primary-content`. `LunaColorKey` is the camelCase variant intended for runtime components/hooks, e.g. `primaryContent`.

```ts
import {
  LUNA_COLOR_IDS,
  LUNA_COLOR_KEYS,
  colorIdToColorKey,
  colorKeyToColorId,
  createEmptyLunaColors,
} from '@lynx-js/luna-core'

const firstId = LUNA_COLOR_IDS[0]
const key = colorIdToColorKey('primary-content')
const id = colorKeyToColorId('primaryContent')

const emptyColors = createEmptyLunaColors()
emptyColors.primary = '#ff8ab5'
```

### Theme Resolver (Pick the Best Match From an Allowlist)

```ts
import { resolveThemeKeyFromList } from '@lynx-js/luna-core'

const allowed = ['luna-light', 'lunaris-dark'] as const

const resolved1 = resolveThemeKeyFromList(allowed, 'lunaris-light')
const resolved2 = resolveThemeKeyFromList(allowed, 'luna-dark')
```

## LUNA Packages

- `@lynx-js/luna-tokens` — source of truth for token values
- `@lynx-js/luna-core` — token and theme type definitions (this package)
- `@lynx-js/luna-styles` — CSS variables output
- `@lynx-js/luna-tailwind` — Tailwind utilities output
- `@lynx-js/luna-reactlynx` — ReactLynx runtime integration
