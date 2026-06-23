# Vue Lynx Port — Porting Guide & Learnings

This directory is a **Vue Lynx** port of `@lynx-js/lynx-ui` (the official
ReactLynx headless UI library that lives in `../packages`). It is a working
record of how to port a ReactLynx component to Vue Lynx so the **public API
mirrors the original 1:1**, plus a reproducible harness for verifying visual
and interaction parity through **Lynx-for-Web**.

The first component ported is **Button** (`src/components/button`), verified
pixel-for-pixel against the original `../apps/examples/Button/Basic`.

---

## 1. Project setup (how this was scaffolded)

Vue Lynx has a first-party scaffolder. The whole project was created with:

```bash
npm create vue-lynx@latest vue-lynx-ui -- --template vue
cd vue-lynx-ui && npm install
```

Key facts learned from the scaffold:

- **Runtime package is `vue-lynx`** (v0.4.0 here), *not* `vue`. It re-exports the
  standard Vue 3 Composition API (`ref`, `computed`, `reactive`, `watch`,
  `provide`, `inject`, `onMounted`, `onUnmounted`, `nextTick`, `withDefaults`…)
  **plus** Lynx-specific APIs (`createApp`, `useMainThreadRef`,
  `runOnMainThread`, `runOnBackground`, `Transition`). Always import from
  `vue-lynx`.
- **Entry** is `src/index.ts`: `createApp(RootComponent).mount()`. Unlike web
  Vue there is no container selector — Lynx has a single page root.
- **Build tool is `rspeedy`** (same as ReactLynx) but with `pluginVueLynx` from
  `vue-lynx/plugin` instead of `pluginReactLynx`. Config lives in
  `lynx.config.ts`. Two environments are emitted: `lynx` (native bundle) and
  `web` (Lynx-for-Web bundle — this is what we screenshot).
- `npm run dev` serves both bundles and a **`/__web_preview?casename=<name>.web.bundle`**
  page that renders the web bundle inside a `<lynx-view>` custom element. This
  preview page is the verification surface.

`pluginVueLynx` options used (mirroring the ReactLynx example's intent):

```ts
pluginVueLynx({
  optionsApi: false,              // we use <script setup> everywhere
  enableCSSInlineVariables: true,
  enableCSSInheritance: true,     // matches example's enableCSSInheritance
})
```

> ReactLynx's example also sets `enableCSSSelector: true`. In Vue Lynx the
> compound class selectors we rely on (`.button.ui-active`) work out of the box
> with the default config — no extra flag was needed.

---

## 2. ReactLynx → Vue Lynx API mapping (cheat sheet)

This is the heart of "make the Vue abstraction mirror the React implementation."
Apply it per component.

| Concern | ReactLynx | Vue Lynx |
| --- | --- | --- |
| Component file | `Foo.tsx` | `Foo.vue` (`<script setup lang="ts">`) |
| Elements | `<view>`, `<text>`, `<image>` (JSX intrinsics) | same tags in `<template>` (Vue global components, typed via `vue-lynx/types`) |
| Tap event | `bindtap={fn}` | `@tap="fn"` (Vue Lynx maps `bindXxx` → `@xxx` / `onXxx`) |
| Touch events | `bindtouchstart` / `bindtouchend` / `bindtouchcancel` | `@touchstart` / `@touchend` / `@touchcancel` |
| Local state | `useState(false)` | `ref(false)` |
| Derived state | `useMemo(() => …, deps)` | `computed(() => …)` (auto-tracked, no dep array) |
| Stable callback | `useMemoizedFn(fn)` | **not needed** — functions defined in `setup` are already stable |
| Props | `(props: FooProps)` | `withDefaults(defineProps<FooProps>(), { … })` |
| Default prop value | `disabled = false` in destructure | second arg of `withDefaults` |
| Callback prop | `onClick?: () => void` | `defineEmits<{ (e:'click'): void }>()` → consumer uses `@click` |
| Render-prop children | `children({ active, disabled })` | **default scoped slot**: `<slot :active :disabled />`, consumer `<template #default="{ active }">` |
| Plain children | `{children}` | same `<slot />` (slot props ignored if unused) |
| Context provider | `<Ctx.Provider value={v}>` | `provide(key, v)` in `setup` |
| Context consumer | `useContext(Ctx)` | `inject(key, fallback)` |
| Class composition | `clsx(className, { 'ui-active': a })` | `:class="[className, { 'ui-active': a }]"` (Vue has built-in object/array class syntax — no `clsx`) |
| `event-through={false}` | prop | `:event-through="false"` |
| Spreading extra view props | `{...buttonProps}` | `v-bind="buttonProps"` |
| CSS files | `import './index.css'` | `import './Foo.css'` inside `<script setup>` (or `<style>` block) |

### Naming the presentational props

ReactLynx exposes `className` and `style` as component props. Vue treats `class`
and `style` as reserved template attributes. To keep the **public API identical**
we still declare `className` / `style` as `defineProps` members and bind them
internally (`:class`, `:style`). Consumers pass them as `class-name="…"` (Vue
kebab-cases camelCase props in templates) — the prop name in code stays
`className`, mirroring React.

### Context carries refs, not values

React context re-renders consumers when the value object changes. Vue injection
is reference-based, so the provided context object holds **`Ref`s**
(`{ active: Ref<boolean>, disabled: Ref<boolean> }`). Descendants read
`.value` and stay reactive without re-running the whole subtree. See
`src/components/button/context.ts`.

---

## 3. Component layout convention

Mirror the ReactLynx package's file responsibilities:

```
src/components/<name>/
  <Name>.vue          # the component (← React <Name>.tsx)
  types.ts            # Props / Emits / RenderProps / UiVariants (← types/index.docs.ts)
  context.ts          # provide/inject helpers (← createContext/useContext)
  use<Behavior>.ts    # composables for cross-cutting behavior (← custom hooks)
  index.ts            # public exports
```

Keep the JSDoc (`@zh` bilingual comments, `@defaultValue`, etc.) from the React
`types/index.docs.ts` verbatim — the design intent and the docs pipeline carry
over.

---

## 4. Verification harness (Lynx-for-Web + headless browser)

The goal is **side-by-side parity** vs the original React edition. Both editions
compile to a Lynx-for-Web bundle and render in the same headless Chromium.

### One-time: build the React baseline (from repo root)

The monorepo requires Node ≥24 but works on Node 22 with the engine check
relaxed:

```bash
npm_config_engine_strict=false pnpm install \
  --config.engine-strict=false --config.strict-peer-dependencies=false
npm_config_engine_strict=false pnpm --filter @lynx-js/luna-styles build   # generates the CSS tokens
cd apps/examples/Button && PORT=3001 pnpm dev    # serves __web_preview
```

### Run the Vue port

```bash
cd vue-lynx-ui && npm install && PORT=3002 npm run dev
```

### Screenshot + interact (scripts in `scripts/`)

Playwright is used headless. Locators **pierce the `<lynx-view>` open shadow
DOM**, so `.button` etc. resolve directly.

```bash
# idle screenshots
node scripts/shot.mjs "http://localhost:3001/__web_preview?casename=ButtonBasic.web.bundle" react.png
node scripts/shot.mjs "http://localhost:3002/__web_preview?casename=main.web.bundle"        vue.png

# press-and-hold to capture the active state + assert tap fires console 'clicked'
node scripts/interact.mjs "<preview-url>" idle.png active.png LABEL

# compose a labelled side-by-side image
node scripts/compose.mjs react.png vue.png "React Lynx (original)" "Vue Lynx (port)" "Title" out.png
```

Evidence for Button lives in `docs/evidence/` (`compare-idle.png`,
`compare-active.png`).

### Harness gotchas (learned the hard way)

- **Node module resolution for Playwright**: Playwright is installed globally
  (`/opt/node22/lib/node_modules`). For ESM scripts, symlink it into a local
  `node_modules` (`ln -s`) — `NODE_PATH` does **not** work for ESM imports.
- **`hasTouch: true`** on the browser context, and drive the press with
  `page.mouse.move → mouse.down → (screenshot) → mouse.up`. The active state only
  exists *while held*, so screenshot **before** releasing.
- Console noise like `NYI: profileStart … issue of lynx-core` and COEP resource
  warnings are **harmless** Lynx-for-Web runtime logs — filter them out.
- Wait ~2.5s after `networkidle`; the Lynx runtime hydrates the `lynx-view`
  shadow DOM after first paint.

---

## 5. Button port — result

- **Visual parity:** the idle screenshots of the React and Vue editions came out
  **byte-identical** PNGs (same size, same pixels).
- **Interaction parity:** pressing the first button darkens it from `--primary`
  (`#ff8ab5`) to `--primary-2` (`#ff4f8f`) in both editions; tapping fires the
  `click`/`onClick` handler (verified via `console.info('clicked')`).
- **API parity:** props (`disabled`, `className`, `style`, `buttonProps`), the
  `click` event (React `onClick`), the scoped-slot render prop (React render-prop
  children), the provided `{ active, disabled }` context, and the injected
  `ui-active` / `ui-disabled` state classes all match.

---

## 6. Checklist for the next component

1. Read the React source: `packages/lynx-ui-<name>/src/*` and its
   `apps/examples/<Name>` demo + CSS.
2. Recreate the folder layout from §3.
3. Translate using the §2 cheat sheet. Prefer Vue built-ins (`computed`,
   object `:class`) over importing the React-side helpers.
4. For any custom React hook, write a composable (`useX.ts`). Drop
   `useMemoizedFn`/`useLatest`-style stability hooks — Vue doesn't need them.
5. Port the example into `src/examples/<name>/` and point `src/index.ts` at it
   (or wire a multi-entry config) so it renders in `__web_preview`.
6. Reuse the luna design tokens in `src/styles/luna/` (copied from
   `@lynx-js/luna-styles` dist) for visual parity.
7. Verify with the §4 harness; commit the side-by-side evidence to
   `docs/evidence/`.
