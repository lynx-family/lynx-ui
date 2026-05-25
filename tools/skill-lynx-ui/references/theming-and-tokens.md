# Theming and Tokens

Read this file when the task involves Luna themes, semantic tokens, or consistent design values across a Lynx UI screen or flow.

## Official docs

- Luna themes/tokens: `https://lynxjs.org/next/lynx-ui/luna-themes-tokens.html`
- Styling and theming setup: `https://lynxjs.org/next/lynx-ui/styling-theming.html#setup`
- Define your own theme: `https://lynxjs.org/next/lynx-ui/luna-themes-tokens.html#define-your-own-theme`

## Default recommendation

Prefer Luna themes/tokens over ad hoc styling when the task is about consistency, shared visual language, or screen-level theming.
Start from the official setup path before giving theme-specific code so imports and theme wiring stay aligned with the docs.

## Built-in themes

- `luna-light`
- `luna-dark`
- `lunaris-light`
- `lunaris-dark`

Use the official theme names when discussing theme selection. Keep custom themes as an override path, not the default path.

## Setup and application workflow

When the user asks how to set up styling or theming, anchor the answer in the official styling/theming setup doc before discussing tokens.
Name the setup doc explicitly, then explain the minimal imports and theme wiring that the official path requires.
If the user wants a built-in theme, recommend the closest official Luna or Lunaris theme first and explain how to apply it through the documented theme setup path rather than inventing a custom provider pattern.
If the user only wants consistent screen styling, you can stop at the setup path plus the smallest useful token set.

## Starter token set

For most screens, start from this semantic set:
- surfaces: `canvas`, `paper`, `paper-clear`
- text: `content`, `content-2`, `content-muted`
- actions: `primary`, `primary-2`, `primary-content`
- structure: `neutral-faint`, `line`, `rule`
- overlays: `backdrop`, `backdrop-heavy`

## Token families

- surface: `canvas`, `canvas-ambient`, `paper`, `paper-clear`, `paper-veil`, `paper-film`
- content: `content`, `content-2`, `content-muted`, `content-subtle`, `content-faint`, `content-faded`
- primary: `primary`, `primary-2`, `primary-muted`, `primary-content`, `primary-content-faded`
- secondary: `secondary`, `secondary-2`, `secondary-content`, `secondary-content-faded`
- neutral: `neutral`, `neutral-2`, `neutral-subtle`, `neutral-faint`, `neutral-ambient`, `neutral-content`, `neutral-content-faded`, `neutral-veil`, `neutral-film`
- lines/backdrop: `line`, `rule`, `backdrop-subtle`, `backdrop`, `backdrop-heavy`
- gradients for Lunaris: `gradient-a`, `gradient-b`, `gradient-c`, `gradient-d`, `gradient-content`, `gradient-content-faded`, `gradient-content-trace`

## CSS setup path

For plain CSS setup, point to the official styling/theming setup doc and keep the import path exact.

```css
@import '@lynx-js/luna-styles/index.css';
```

That import exposes Luna semantic tokens as CSS variables such as `--paper`, `--content`, and `--line`.

## CSS variable example

```css
.card {
  color: var(--content);
  background-color: var(--paper);
  border: 1px solid var(--line);
}
```

## Tailwind setup path

Treat Tailwind-based Luna styling as a two-layer setup.
Layer 1 is the base Rspeedy/Lynx Tailwind integration that generates utility classes at build time.
Layer 2 is the Luna Tailwind theming layer that adds Luna token utilities and built-in theme classes on top of that base pipeline.

For Layer 1, anchor the answer in the official Rspeedy Tailwind doc: `https://lynxjs.org/next/rspeedy/styling.html#using-tailwind-css`.
Explain that the project needs Tailwind CSS v3, `@lynx-js/tailwind-preset`, a PostCSS config that enables `tailwindcss`, Tailwind CSS directives, and a base Tailwind config that includes the Lynx preset.
If generic utility classes such as `flex` or `rounded-2xl` are missing from the generated CSS, the problem is in Layer 1, not in Luna theme selection.

For Layer 2, anchor the answer in the official styling/theming setup doc and include the official Luna preset names and order.
Use `LynxPreset` from `@lynx-js/tailwind-preset` and `LunaPreset` from `@lynx-js/luna-tailwind`, then keep the presets array ordered as `[LynxPreset, LunaPreset]`.
Mention that `@lynx-js/tailwind-preset` is required for runtime compatibility.
After both layers are in place, Luna tokens can be used through utility classes such as `bg-primary` and `text-content`, and built-in themes can be applied with container classes like `luna-light` or `luna-dark`.
If Luna CSS variables are present but selectors like `bg-paper` are missing, say explicitly that theme tokens loaded but the Tailwind utility pipeline is still incomplete.
After changing Tailwind, PostCSS, preset, or plugin wiring, tell the user to rebuild and refresh the relevant plugin or session state before concluding the configuration is still wrong.
If the config matches the docs but the emitted CSS still looks stale, suspect cached dev-server, plugin, or session state before inventing more config changes.

## Tailwind or className-style example

```tsx
<view className="bg-paper text-content border border-line">
  <text className="text-content-muted">Description</text>
</view>
```

## Custom theme definition

Use a custom theme only when the user has a concrete branding or override need that the built-in themes do not cover.
When that happens, point to the official "Define your own theme" section first and keep the answer close to that structure.
Explain which semantic tokens are being overridden and why, instead of presenting the custom theme as generic CSS.

```css
.my-brand-dark {
  --primary: #ff4f8b;
  --primary-content: #ffffff;
  --paper: #141414;
  --content: #f8f8f8;
}
```

## Guidance rules

- Prefer semantic roles like `paper`, `content`, `primary`, and `line` instead of raw hex values.
- Keep Luna as the default recommendation unless the user explicitly wants a custom local theme system.
- If the user asks for setup help, mention the official styling/theming setup doc before moving into token examples.
- If the user asks for built-in themes, recommend the closest Luna or Lunaris theme and explain how it fits the setup path.
- If the user asks for Tailwind setup, explain the two-layer model: base Rspeedy/Lynx Tailwind integration first, then Luna theming on top.
- For the base Tailwind layer, mention Tailwind CSS v3, PostCSS `tailwindcss: {}`, Tailwind CSS directives, and `@lynx-js/tailwind-preset`.
- For the Luna layer, mention `@lynx-js/luna-tailwind` and the preset order `[LynxPreset, LunaPreset]`.
- If tokens are present but utility selectors are missing, diagnose that as an incomplete Tailwind integration rather than a broken Luna theme.
- After changing Tailwind integration files, suggest rebuild plus plugin/session refresh before assuming another config step is missing.
- If the user asks for a brand theme, point to the official custom-theme section and describe the token overrides in semantic terms.
- If the user asks for consistency across multiple surfaces, reach for tokens before proposing one-off style props.
- Explain the smallest token set that solves the task instead of dumping every token.
- If exact local component styling hooks matter, verify them separately in generated component references rather than inferring them from theme docs.

## Avoid

- replacing Luna with hard-coded colors unless the user asks for that tradeoff
- inventing a parallel theming system when Lynx UI already covers the need
- flattening semantic tokens into generic style constants without a reason
