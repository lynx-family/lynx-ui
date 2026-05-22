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
import type { Config } from 'tailwindcss';

import LynxPreset from '@lynx-js/tailwind-preset';

import { LunaPreset } from '@lynx-js/luna-tailwind';

const config: Config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [LynxPreset, LunaPreset],
};

export default config;
```

Tailwind on Lynx requires `@lynx-js/tailwind-preset` for runtime compatibility.

Some Tailwind integrations can provide source scanning automatically, so the
`content` field may not be required in every setup. For example, when using
`rsbuild-plugin-tailwindcss` the plugin replaces Tailwind's `content` config at
build time.

Import LUNA theme variables once (global stylesheet):

```css
@import "@lynx-js/luna-styles/index.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Usage

```tsx
import { Button } from '@lynx-js/lynx-ui';

function App() {
  return (
    <view className='lunaris-dark'>
      <Button className='bg-primary'>
        <text className='text-primary-content'>Button</text>
      </Button>
    </view>
  );
}
```

## Built-in Gradients

This preset also ships gradient classes that use the LUNA gradient tokens:

- `luna-gradient` — the full signature gradient, spanning the complete LUNA color journey.
- `luna-gradient-rose` — a warm rose gradient for soft pink surfaces.
- `luna-gradient-berry` — a richer berry gradient with a warmer, more saturated lower glow.
- `luna-gradient-afterglow` — an angled pink-to-lavender gradient inspired by the lingering glow after sunset.
- `luna-gradient-ocean` — a cool lavender-to-aqua gradient inspired by atmospheric haze and moonlit tides.

## LUNA Packages

- `@lynx-js/luna-tokens` — source of truth for token values
- `@lynx-js/luna-core` — token and theme type definitions
- `@lynx-js/luna-styles` — CSS variables output
- `@lynx-js/luna-tailwind` — Tailwind utilities output (this package)
- `@lynx-js/luna-reactlynx` — ReactLynx runtime integration
