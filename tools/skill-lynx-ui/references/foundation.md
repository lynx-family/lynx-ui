# Foundation

Read this file first when the task is about how to work with Lynx UI correctly: setup, adaptation, routing between local references, or troubleshooting whether the problem really belongs to Lynx UI.

## Table of contents

- [Why this file exists](#why-this-file-exists)
- [Official docs](#official-docs)
- [What this file covers](#what-this-file-covers)
- [Routing rules](#routing-rules)
- [Install and setup](#install-and-setup)
- [Adaptation rules](#adaptation-rules)
- [Example: keep the official component shape](#example-keep-the-official-component-shape)
- [Example: preserve token semantics](#example-preserve-token-semantics)
- [Example: preserve motion choice](#example-preserve-motion-choice)
- [Common failure modes](#common-failure-modes)
- [Troubleshooting checklist](#troubleshooting-checklist)
- [Escalation](#escalation)
- [Output style](#output-style)

## Why this file exists

This file condenses the general working rules for Lynx UI into one place so the skill can load one dense foundation reference before reaching for more specific docs.

## Official docs

- Index: `https://lynxjs.org/next/lynx-ui/`
- Introduction: `https://lynxjs.org/next/lynx-ui/introduction`
- Luna themes/tokens: `https://lynxjs.org/next/lynx-ui/luna-themes-tokens.html`
- Styling and theming setup: `https://lynxjs.org/next/lynx-ui/styling-theming.html#setup`
- Motion: `https://lynxjs.org/next/lynx-ui/motion.html`
- Motion Mini: `https://lynxjs.org/next/lynx-ui/motion-mini.html`

## What this file covers

- when to stay close to official Lynx UI snippets
- when to route to `components.md` versus `screen-recipes.md`
- how to keep Luna tokens, motion choices, and official component semantics intact
- how to diagnose setup drift, snippet drift, and non-Lynx-UI problems
- when to route to `reference.md` and generated component references for exact repo-local APIs

## Routing rules

- If the user needs a specific primitive or official example, go to [`components.md`](./components.md).
- If the user needs a multi-part screen or flow, go to [`screen-recipes.md`](./screen-recipes.md).
- If the task is mainly about shared visual consistency, theme setup, built-in Luna theme application, or custom theme definition, pair the answer with [`theming-and-tokens.md`](./theming-and-tokens.md).
- If the task depends on animation capability, pair the answer with [`motion.md`](./motion.md).
- If the task depends on exact props, exports, or bundled repo examples for a component in this package, use `reference.md`, `references/index.md`, and `references/components/<component>/`.
- If the issue is really architectural or type/config related, hand off to the relevant local Lynx skill instead of forcing a UI-specific answer.

## Install and setup

Start from the official install path unless the user gives a concrete reason to optimize package boundaries.

```bash
npm i @lynx-js/lynx-ui
```

The docs position `@lynx-js/lynx-ui` as the default entrypoint. Prefer that by default because it keeps guidance close to the official examples while still allowing tree-shaking.

### Import example

```tsx
import { Button } from '@lynx-js/lynx-ui';

export default function App() {
  return (
    <view>
      <Button />
    </view>
  );
}
```

### Narrower package choice

If the user explicitly wants per-component installation, the docs also show a narrower package style such as:

```bash
npm install @lynx-js/lynx-ui-button
```

Use that only when the user has a clear package-boundary or distribution reason. Otherwise keep the full-library install because that matches the official getting-started path more closely.

### Config snippet

If the project setup is being created or repaired, align with the official ReactLynx config shape before inventing custom wiring.

```ts
export default defineConfig({
  plugins: [
    pluginReactLynx({
      enableNewGesture: true,
    }),
  ],
})
```

## Adaptation rules

- Start from the closest official Lynx UI snippet first.
- Unless the user asks otherwise, keep the official Lynx UI way of building the feature.
- Adapt only the parts that need to match the user's file layout, data source, and naming.
- Preserve official subcomponent structure instead of flattening it into generic wrappers.
- Keep controlled vs uncontrolled usage aligned with the docs.
- Prefer Luna semantic tokens over ad hoc colors when the task is about shared design values.
- Choose motion versus motion-mini deliberately instead of defaulting to a generic animation answer.
- If a component depends on gesture-specific props or main-thread callbacks, keep that architecture intact.
- If exact repo-local component surface matters, verify it in the generated component references instead of inferring.

## Example: keep the official component shape

Official-style starting point:

```tsx
import { Button } from '@lynx-js/lynx-ui';

export default function App() {
  return (
    <view>
      <Button />
    </view>
  );
}
```

Minimal project-local adaptation:

```tsx
import { Button } from '@lynx-js/lynx-ui';

export function ListActions() {
  return (
    <view className="px-16 py-12">
      <Button />
    </view>
  );
}
```

What changed:
- component name
- surrounding wrapper
- local class names

What stayed aligned with the docs:
- package import
- Lynx UI component usage
- overall component shape

## Example: preserve token semantics

Preferred:

```tsx
<view className="bg-paper text-content border border-line">
  <text className="text-content-muted">Description</text>
</view>
```

Avoid unless the user explicitly asks for it:

```tsx
<view style={{ backgroundColor: '#ffffff', color: '#111111', borderColor: '#dddddd' }} />
```

## Example: preserve motion choice

If the closest official solution uses motion or motion-mini, keep that capability choice unless the user gives a reason to change it.

- Use motion when you need richer animated values or derived styles.
- Use motion-mini when you only need a small numeric transition and direct style writes are acceptable.

## Common failure modes

- Using a Lynx UI component name but rewriting the composition into generic React structure.
- Treating a multi-part screen as if it were a single missing component prop.
- Replacing Luna token guidance with one-off hex colors even when the task is about consistency.
- Reaching for motion by default when the user only needs a structural component answer.
- Forcing a Lynx UI answer when the real blocker is ReactLynx architecture or TypeScript configuration.
- Skipping the generated component references when the task depends on exact repo-local surface.

## Troubleshooting checklist

- Does the package import match the installation advice?
- Does the component choice map to a real official docs page?
- Did the answer preserve Luna tokens if the task was about theming?
- Did the answer explicitly choose motion vs motion-mini if animation was involved?
- Did the code assume unsupported web-only APIs?
- If exact props or exports mattered, were generated component references checked?

## Escalation

If the issue is not really a Lynx UI problem, point the user to the closest local Lynx skill in this repo instead of forcing a UI-specific answer.

- If the issue is architectural, thread-sensitive, or really about ReactLynx behavior, consult `reactlynx-best-practices`.
- If the issue is type, config, or compiler related, consult `lynx-typescript`.
- If the issue is about choosing or composing official Lynx UI primitives correctly, stay in this `lynx-ui` skill and pull the answer back toward the closest official Lynx UI docs page.

## Output style

- Name the closest official Lynx UI page that should anchor the answer.
- Name the closest local reference file or pair of files being used.
- If exact repo-local component surface is relevant, cite the generated component reference file too.
- Explain only the minimal local adaptations.
- If the problem belongs to another local Lynx skill, say which one and why.
- Keep the fix close to the official Lynx UI pattern before proposing deeper rewrites.
