# luna-tailwind

TailwindCSS preset for the LUNA theming system.

`@lynx-js/luna-tailwind` maps LUNA color tokens to Tailwind color utilities using CSS variables. It is designed to be used together with `@lynx-js/luna-styles`, which provides the actual `--*` variables under theme class names (e.g. `.lunaris-dark`, `.luna-light`).

## Installation

```bash
pnpm add -D @lynx-js/luna-tailwind @lynx-js/tailwind-preset tailwindcss@v3
pnpm add @lynx-js/luna-styles
```

## How It Works

- `theme.colors` is extended so utilities like `bg-primary` resolve to `var(--primary)`
- Tokens are registered as nested Tailwind color keys and expand into hyphenated utilities — `text-primary-content` resolves to `var(--primary-content)`
- Variables are scoped by the theme class you apply in your DOM tree, so switching themes is just toggling the theme class name

## Setup

Add the preset to your `tailwind.config.ts`:

```ts
import LynxPreset from '@lynx-js/tailwind-preset'
import type { Config } from 'tailwindcss'

import { LunaPreset } from '@lynx-js/luna-tailwind'

const config: Config = {
  content: [],
  presets: [LynxPreset, LunaPreset],
}

export default config
```

Import LUNA theme variables once (global stylesheet):

```css
@import "@lynx-js/luna-styles/index.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Usage

```tsx
import { Button } from '@lynx-js/lynx-ui'

function App() {
  return (
    <view className='lunaris-dark'>
      <Button className='bg-primary'>
        <text className='text-primary-content'>Button</text>
      </Button>
    </view>
  )
}
```

## Built-in Gradients

This preset also ships gradient classes that use the LUNA gradient tokens:

- `luna-gradient`
- `luna-gradient-rose`
- `luna-gradient-berry`
- `luna-gradient-ocean`

## LUNA Packages

- `@lynx-js/luna-tokens` — source of truth for token values
- `@lynx-js/luna-core` — token and theme type definitions
- `@lynx-js/luna-styles` — CSS variables output
- `@lynx-js/luna-tailwind` — Tailwind utilities output (this package)
- `@lynx-js/luna-reactlynx` — ReactLynx runtime integration
