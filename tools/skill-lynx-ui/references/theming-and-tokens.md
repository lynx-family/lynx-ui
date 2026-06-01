# Theming and Tokens

Read this file for Luna themes, semantic tokens, and shared visual values.

## Contents

- [Official docs](#official-docs)
- [Built-in themes](#built-in-themes)
- [CSS setup](#css-setup)
- [Token reference](#token-reference)
- [Tailwind setup](#tailwind-setup)
- [Custom themes](#custom-themes)

## Official docs

- Luna themes/tokens: `https://lynxjs.org/next/lynx-ui/luna-themes-tokens.html`
- Styling and theming setup: `https://lynxjs.org/next/lynx-ui/styling-theming.html#setup`
- Define your own theme: `https://lynxjs.org/next/lynx-ui/luna-themes-tokens.html#define-your-own-theme`

## Built-in themes

- `luna-light`
- `luna-dark`
- `lunaris-light`
- `lunaris-dark`

Use a built-in theme unless the task requires brand-specific overrides.

## CSS setup

```css
@import '@lynx-js/luna-styles/index.css';

.card {
  color: var(--content);
  background-color: var(--paper);
  border: 1px solid var(--line);
}
```

## Token reference

Start with the smallest semantic set needed by the screen:

- surfaces: `canvas`, `paper`, `paper-clear`
- text: `content`, `content-2`, `content-muted`
- actions: `primary`, `primary-2`, `primary-content`
- structure: `neutral-faint`, `line`, `rule`
- overlays: `backdrop`, `backdrop-heavy`

Additional families:

- surface: `canvas`, `canvas-ambient`, `paper`, `paper-clear`, `paper-veil`, `paper-film`
- content: `content`, `content-2`, `content-muted`, `content-subtle`, `content-faint`, `content-faded`
- primary: `primary`, `primary-2`, `primary-muted`, `primary-content`, `primary-content-faded`
- secondary: `secondary`, `secondary-2`, `secondary-content`, `secondary-content-faded`
- neutral: `neutral`, `neutral-2`, `neutral-subtle`, `neutral-faint`, `neutral-ambient`, `neutral-content`, `neutral-content-faded`, `neutral-veil`, `neutral-film`
- lines/backdrop: `line`, `rule`, `backdrop-subtle`, `backdrop`, `backdrop-heavy`
- Lunaris gradients: `gradient-a`, `gradient-b`, `gradient-c`, `gradient-d`, `gradient-content`, `gradient-content-faded`, `gradient-content-trace`

## Tailwind setup

Tailwind-based Luna styling has two layers:

1. Configure the base Rspeedy/Lynx Tailwind pipeline with Tailwind CSS v3, PostCSS `tailwindcss: {}`, Tailwind CSS directives, and `@lynx-js/tailwind-preset`.
2. Add `@lynx-js/luna-tailwind` with presets ordered as `[LynxPreset, LunaPreset]`.

Use `LynxPreset` from `@lynx-js/tailwind-preset` and `LunaPreset` from `@lynx-js/luna-tailwind`.

```tsx
<view className="bg-paper text-content border border-line">
  <text className="text-content-muted">Description</text>
</view>
```

Troubleshooting:

- Missing generic utilities such as `flex`: inspect the base Tailwind pipeline.
- Present Luna variables but missing selectors such as `bg-paper`: inspect the Luna Tailwind layer.
- Stale emitted CSS after configuration changes: rebuild and refresh the dev server or plugin session.

## Custom themes

Override semantic tokens only when built-in themes do not cover the requirement:

```css
.my-brand-dark {
  --primary: #ff4f8b;
  --primary-content: #ffffff;
  --paper: #141414;
  --content: #f8f8f8;
}
```
