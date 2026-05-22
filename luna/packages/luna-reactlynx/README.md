# luna-reactlynx

> ⚠️ This package is under active development. APIs may change without notice.

LUNA theming utilities for ReactLynx — theme context, provider, color consumption hooks, and an optional runtime shell component.

Two integration styles are supported:

- **JS Tokens** — use `createLunaTheme()` + `LunaThemeProvider` + `useLunaColor(s)` to consume theme values from JS. Hooks can return either raw values or `var(...)` references, but returning `var(...)` does not create CSS variables by itself.
- **CSS Variables** — use theme classes from `@lynx-js/luna-styles` (e.g. `lunaris-light`) with `LunaTheme` (or your own root `className`) to scope real CSS variables. Components consume via `var(--xxx)` or Tailwind semantic utilities.

## Installation

**JS Tokens style:**

```bash
pnpm add @lynx-js/luna-reactlynx @lynx-js/luna-tokens
```

**CSS Variables style:**

```bash
pnpm add @lynx-js/luna-reactlynx @lynx-js/luna-styles
```

## Entry points

| Entry                                        | Contents                                                |
| -------------------------------------------- | ------------------------------------------------------- |
| `@lynx-js/luna-reactlynx`                      | Provider, hooks, `createLunaTheme`, type re-exports     |
| `@lynx-js/luna-reactlynx/theming`              | Theming-only subpath                                    |
| `@lynx-js/luna-reactlynx/runtime`              | Runtime shell (`LunaTheme`)                             |
| `@lynx-js/luna-reactlynx/runtime/global-props` | TS type augmentation for `lynx.__globalProps.lunaTheme` |

## Usage: JS Tokens

`createLunaTheme(tokens)` converts a token input into a `LunaRuntimeTheme`. Pass one or more themes to `LunaThemeProvider` and consume colors with hooks. Use this style when you need theme values accessible in JS — for animation, computation, or non-CSS color usage.

If you want to switch themes by toggling a class, use the CSS Variables style section. If you want a theme object in JS (animation, computations, non-CSS color usage), use JS Tokens.

```tsx
import {
  LunaThemeProvider,
  createLunaTheme,
  useLunaColors,
} from '@lynx-js/luna-reactlynx';
import { lunarisDarkTokens, lunarisLightTokens } from '@lynx-js/luna-tokens';

const themes = [
  createLunaTheme(lunarisLightTokens),
  createLunaTheme(lunarisDarkTokens),
];

export function App() {
  return (
    <LunaThemeProvider
      themes={themes}
      themeKey={lynx.__globalProps.lunaTheme ?? 'lunaris-light'}
    >
      <Demo />
    </LunaThemeProvider>
  );
}

function Demo() {
  const colors = useLunaColors();
  return <view style={{ backgroundColor: colors.canvas }} />;
}
```

**Single theme:** pass `theme` instead of `themes`.

```tsx
<LunaThemeProvider theme={createLunaTheme(lunarisLightTokens)}>
  {children}
</LunaThemeProvider>;
```

### Color consumption format

`theme.colors` always stores canonical raw values (e.g. `#ff1a6e`, `rgba(...)`). The `consumptionFormat` on the runtime theme controls what hooks return by default, and hooks can also override it per call.

| What you want     | Hook options            | Example output   |
| ----------------- | ----------------------- | ---------------- |
| Raw value         | `{ format: 'value' }`   | `#ff1a6e`        |
| CSS var reference | `{ format: 'var-ref' }` | `var(--primary)` |
| CSS var name      | `{ as: 'var-name' }`    | `--primary`      |

Supported output shapes:

- `format` chooses the _consumption result_ (`'value'` vs `'var-ref'`) when `as: 'result'` (default).
- `as: 'var-name'` returns the bare CSS custom property name `--xxx` rather than a complete CSS value, useful for building expressions like `var(--xxx, fallback)` or `calc(...)`.

Example:

```tsx
import { useLunaColor } from '@lynx-js/luna-reactlynx';

const getValue = useLunaColor({ format: 'value' });
const getVarRef = useLunaColor({ format: 'var-ref' });
const getVarName = useLunaColor({ as: 'var-name' });

getValue('primary'); // '#ff1a6e' (values-backed theme only)
getVarRef('primary'); // 'var(--primary)'
getVarName('primary'); // '--primary'
```

#### CSS var prefix

If your CSS variables are emitted with a prefix (e.g. `--luna-primary`), set `cssVarPrefix` either when creating the runtime theme (default for all hooks) or when consuming:

```tsx
import {
  LunaThemeProvider,
  createLunaTheme,
  useLunaColor,
} from '@lynx-js/luna-reactlynx';
import { lunarisLightTokens } from '@lynx-js/luna-tokens';

const theme = createLunaTheme(lunarisLightTokens, {
  consumptionFormat: 'var-ref',
  cssVarPrefix: 'luna',
});

<LunaThemeProvider theme={theme}>
  <Demo />
</LunaThemeProvider>;

function Demo() {
  const getColor = useLunaColor();
  getColor('primary'); // 'var(--luna-primary)'

  const getUnprefixed = useLunaColor({ cssVarPrefix: '' });
  getUnprefixed('primary'); // 'var(--primary)'
}
```

> If you pass a meta-only theme input (no concrete values), only `consumptionFormat: 'var-ref'` is valid — `createLunaTheme()` will throw otherwise.

## Usage: CSS Variables

Import the LUNA stylesheet globally, then apply a theme class (e.g., `lunaris-light`) to scope variables under your app root. `LunaTheme` is an optional helper that reads the active theme key and attaches the resolved theme class to the root node.

If you prefer to manage the class yourself, you can skip `LunaTheme` entirely:

```tsx
import '@lynx-js/luna-styles/index.css';
import './app.css';

export function App() {
  return (
    <page className='lunaris-light'>
      <view className='app' />
    </page>
  );
}
```

> Note: To use `var(--xxx)` in inline `style={{ ... }}`, you need Lynx SDK version 3.6 or higher. For Lynx SDK versions below 3.6, use CSS variables through Tailwind utilities or with a stylesheet (Vanilla CSS), and apply theme classes directly on elements instead of using inline style.

### Inline style (Lynx SDK >= 3.6)

```tsx
import { LunaTheme } from '@lynx-js/luna-reactlynx/runtime';
import '@lynx-js/luna-styles/index.css';

export function App() {
  return (
    <LunaTheme>
      <view style={{ backgroundColor: 'var(--canvas)' }} />
    </LunaTheme>
  );
}
```

`LunaTheme` resolves the active theme key in this order:

1. The explicit `themeKey` prop
2. `lynx.__globalProps.lunaTheme`
3. The built-in default

**Optional:** for typed `lynx.__globalProps.lunaTheme`, import the augmentation once at your app entry:

```ts
import '@lynx-js/luna-reactlynx/runtime/global-props';
```

### Tailwind (Lynx SDK < 3.6 friendly)

If you use Tailwind, pair `@lynx-js/luna-styles` (variables) with `@lynx-js/luna-tailwind` (utilities). Then you can consume colors via semantic utilities like `bg-canvas` / `text-content` without relying on inline `var(...)`.

```tsx
import { LunaTheme } from '@lynx-js/luna-reactlynx/runtime';
import '@lynx-js/luna-styles/index.css';

export function App() {
  return (
    <LunaTheme>
      <view className='bg-canvas'>
        <text className='text-content'>Hello</text>
      </view>
    </LunaTheme>
  );
}
```

### Vanilla CSS class (Lynx SDK < 3.6 friendly)

Consume `var(--xxx)` in a stylesheet, then reference it by `className`:

```css
.app {
  background-color: var(--canvas);
  color: var(--content);
}
```

```tsx
import { LunaTheme } from '@lynx-js/luna-reactlynx/runtime';
import '@lynx-js/luna-styles/index.css';
import './app.css';

export function App() {
  return (
    <LunaTheme>
      <view className='app' />
    </LunaTheme>
  );
}
```

## How to understand `LunaThemeProvider` vs `LunaTheme`

They are orthogonal and can be used independently:

- `LunaTheme` (runtime shell): only toggles the theme class name on your root node, so the CSS variables from `@lynx-js/luna-styles` become active in that subtree.
- `LunaThemeProvider` (theming context): provides a resolved theme object to hooks like `useLunaColor(s)`. It does not inject any CSS variables into the runtime.

In other words, `LunaTheme` is a convenience for applying the theme class; if you already manage the root class yourself, you do not need it.

## Which style to use

|                                                        | JS Tokens        | CSS Variables                     |
| ------------------------------------------------------ | ---------------- | --------------------------------- |
| Color consumption                                      | Raw values in JS | `var(--xxx)` / Tailwind utilities |
| Already using `@lynx-js/luna-styles`                     | —                | ✓                                 |
| Need theme object in JS (e.g. animation, inline style) | ✓                | —                                 |

## LUNA Packages

- `@lynx-js/luna-tokens` — source of truth for token values
- `@lynx-js/luna-core` — token and theme type definitions
- `@lynx-js/luna-styles` — CSS variables output
- `@lynx-js/luna-tailwind` — Tailwind utilities output
- `@lynx-js/luna-reactlynx` — ReactLynx runtime integration (this package)
