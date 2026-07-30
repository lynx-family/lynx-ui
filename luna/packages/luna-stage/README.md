# luna-stage

> Stage system and showcase components for the L.U.N.A project.
> Atomic components for rendering Lynx bundles into a device shell / stage in the browser.

Use `luna-stage` when you need a single-frame preview (`Stage` + `LunaLynxStage`) or motion-enhanced presentation (`MotionStage`, etc.). For multi-stage orchestration and Studio-level layout, see [`@lynx-js/luna-studio`](../luna-studio).

## Contents

- [Installation](#installation)
- [Entry Points](#entry-points)
- [Concepts](#concepts)
- [Quick Start](#quick-start)
- [API](#api)
- [Usage Examples](#usage-examples)
- [SSR / SSG Notes](#ssr--ssg-notes)
- [Transform Utilities](#transform-utilities)

## Installation

```sh
pnpm i @lynx-js/luna-stage
```

**Peer dependencies** — install in your application:

```sh
pnpm i react
```

For Lynx rendering (`LynxStage` / `LunaLynxStage`), install the Lynx Web runtime:

```sh
pnpm i @lynx-js/web-core
```

For motion capabilities, install `motion`:

```sh
pnpm i motion
```

## Entry Points

| Import path                | Requires `motion` | Requires `@lynx-js/web-core` | Use when                                                  |
| -------------------------- | ----------------- | ---------------------------- | --------------------------------------------------------- |
| `@lynx-js/luna-stage`        | No                | No                           | Static device frame + shared hooks                        |
| `@lynx-js/luna-stage/lynx`   | No                | Yes                          | Lynx bundle rendering (`LynxStage` / `LunaLynxStage`)     |
| `@lynx-js/luna-stage/motion` | Yes               | No                           | Animated transitions + perspective camera (`MotionStage`) |

## Concepts

### Device Frame Model

- `baseWidth` / `baseHeight` define the **design baseline** (default `375×812`), not the viewport size.
- The frame renders at its base dimensions and uses CSS `transform: scale()` to fit into the viewport.
- Two visual layers: **outline** (decorative border, simulates device thickness) and **frame** (content area with clip-path).
- `Stage` only: an absolutely-positioned 0×0 anchor sits inside the viewport at the `placeX/placeY` location; the outline and frame are transformed around this anchor.

### Fit System

- `contain` — scales down to fit fully inside the viewport (no cropping).
- `cover` — scales up to fully cover the viewport (may crop).
- `alignX` / `alignY` — alignment of the frame within the viewport. In `cover` mode also determines which part of the frame is preserved when cropped. Physical directions: `left | center | right` / `top | center | bottom`.
- `placeX` / `placeY` _(Stage only)_ — placement of the anchor within the viewport, decoupled from `alignX/Y`. Defaults to match `alignX/Y` for object-position-like semantics. Override only when you want the frame's internal alignment to differ from its viewport position (rare).
- `fitProgress` _(motion only)_ — continuous `0→1` interpolation between `contain` and `cover`, driven by a spring.

### Camera Model _(MotionStage only)_

The transform pipeline operates in two independent spaces:

**Screen space**

- `fit` / `fitProgress` — viewport-driven passive scaling.
- `zoom` — user-controlled active scaling, applied on top of fit.
- `panX` / `panY` — screen-space translation in pixels, applied after all scaling.

**World space**

- `world` — 3D position of the frame `{ x, y, z }`. Follows the CSS/OpenGL convention: `+Z` points toward the viewer.
- `focalLength` — perspective intensity. When `> 0`, enables perspective projection. When `0` or omitted, orthographic.
- `world.x/y` are projected into screen space before being composited with `panX/panY`. The spring animates the combined screen-space value.

Final scale = `lerpFitScale(contain, cover, fitSpring) × zoom × depthScale`

Final translation = `world.xy × depthScale + panXY`

## Quick Start

### Single-frame preview with `LunaLynxStage`

```tsx
import { Stage, StageContainer } from '@lynx-js/luna-stage';
import { LunaLynxStage } from '@lynx-js/luna-stage/lynx';

export default function Preview() {
  return (
    <StageContainer className='w-full h-screen'>
      <Stage>
        <LunaLynxStage
          entry='my-component'
          bundleRoot='/bundles/'
          lunaTheme='lunaris-dark'
        />
      </Stage>
    </StageContainer>
  );
}
```

Default bundle URL convention: `${bundleRoot}${entry}.web.bundle`.

Override it with `resolveBundleSrc` when your host uses a different naming rule.

`bundleRoot` is normalized internally to always end with a trailing slash before URL resolution. This means callers may pass either `'/bundles'` or `'/bundles/'`, and `resolveBundleSrc` will always receive the normalized value.

`lunaTheme` injects LUNA design token globals into the Lynx runtime.

### Without LUNA theming

Use `LynxStage` directly when you don't need LUNA global props forwarded:

```tsx
import { Stage, StageContainer } from '@lynx-js/luna-stage';
import { LynxStage } from '@lynx-js/luna-stage/lynx';

<StageContainer className='w-full h-screen'>
  <Stage>
    <LynxStage entry='my-component' bundleRoot='/bundles/' />
  </Stage>
</StageContainer>;
```

### Standalone `LynxStage`

`LynxStage` can be used independently of the `Stage` system if you just want to render a Lynx view in a DOM container:

```tsx
import { LynxStage } from '@lynx-js/luna-stage/lynx';

export default function StandaloneView() {
  return (
    <div className='w-full h-screen'>
      <LynxStage entry='my-component' bundleRoot='/bundles/' />
    </div>
  );
}
```

## API

### `Stage`

Static device frame. Reads viewport size from `StageContainer` context if present, otherwise falls back to `baseWidth/baseHeight`.

`Stage` supports two ways to determine its viewport size:

**Auto-fit to parent (recommended)** — wrap in `StageContainer` so the viewport auto-measures and the frame fits to it:

```tsx
<StageContainer className='w-full h-full'>
  <Stage>
    <YourContent />
  </Stage>
</StageContainer>;
```

**Explicit viewport size** — pass `width` / `height` directly to `Stage`. Useful for fixed-size previews, server-rendered layouts, or anywhere you'd rather not add a measuring wrapper:

```tsx
<Stage width={390} height={844}>
  <YourContent />
</Stage>;
```

> **Note:** Wrapping `Stage` in a sized `<div>` without `StageContainer` won't make the frame fit the div — `Stage` has no way to read the div's size and will fall back to `baseWidth × baseHeight`. Use `StageContainer` or pass `width`/`height` directly.

#### Props

| Prop         | Type                            | Default     | Description                                                                                                             |
| ------------ | ------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `baseWidth`  | `number`                        | `375`       | Design baseline width in pixels.                                                                                        |
| `baseHeight` | `number`                        | `812`       | Design baseline height in pixels.                                                                                       |
| `width`      | `number`                        | —           | Explicit viewport size. Drives both rendered `<div>` size and fit/scale. Falls back to `StageContainer` → `baseWidth`.  |
| `height`     | `number`                        | —           | Explicit viewport size. Drives both rendered `<div>` size and fit/scale. Falls back to `StageContainer` → `baseHeight`. |
| `fit`        | `'contain' \| 'cover'`          | `'contain'` | Fit mode.                                                                                                               |
| `alignX`     | `'left' \| 'center' \| 'right'` | `'center'`  | Horizontal alignment of frame within viewport. In `cover` mode also determines crop anchor.                             |
| `alignY`     | `'top' \| 'center' \| 'bottom'` | `'center'`  | Vertical alignment of frame within viewport. In `cover` mode also determines crop anchor.                               |
| `placeX`     | `'left' \| 'center' \| 'right'` | `alignX`    | Horizontal placement of the internal anchor within the viewport. Override to decouple placement from alignment.         |
| `placeY`     | `'top' \| 'center' \| 'bottom'` | `alignY`    | Vertical placement of the internal anchor within the viewport. Override to decouple placement from alignment.           |
| `zoom`       | `number`                        | `1`         | Additional zoom factor on top of fit.                                                                                   |
| `panX`       | `number`                        | `0`         | Screen-space translation along X (px).                                                                                  |
| `panY`       | `number`                        | `0`         | Screen-space translation along Y (px).                                                                                  |
| `className`  | `string`                        | —           | Applied to the outline layer.                                                                                           |
| `style`      | `CSSProperties`                 | —           | Applied to the outline layer.                                                                                           |
| `onClick`    | `MouseEventHandler`             | —           | —                                                                                                                       |

### `StageContainer`

Measures its own DOM size via `ResizeObserver` and provides width/height to child `Stage` components via context.

Add padding, border, or layout styling to `StageContainer` freely — the measured content box is what `Stage` fits to, so padding works as expected visual margin around the frame.

Avoid setting `transform`, `filter`, `perspective`, `backdrop-filter`, or `contain: paint/layout/strict` on `StageContainer` — these establish a containing block that traps `position: fixed` descendants inside the stage.

#### Props

| Prop             | Type     | Default | Description                    |
| ---------------- | -------- | ------- | ------------------------------ |
| `fallbackWidth`  | `number` | `0`     | Used before first measurement. |
| `fallbackHeight` | `number` | `0`     | Used before first measurement. |

Inherits all `<div>` HTML attributes (`className`, `style`, etc.).

### `LynxStage`

Core component for rendering Lynx bundles into a DOM container.

| Prop                  | Type                      | Default | Description                                                                                                                  |
| --------------------- | ------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `entry`               | `string`                  | —       | Entry name for the Lynx bundle.                                                                                              |
| `bundleRoot`          | `string`                  | `'/'`   | Resource root used with `entry` to locate the bundle. Normalized to always end with `/` before URL resolution.               |
| `resolveBundleSrc`    | `function`                | —       | Optional hook for overriding how the final bundle URL is built. Receives the normalized `bundleRoot` (always ends with `/`). |
| `globalProps`         | `Record<string, unknown>` | —       | Global props to inject into the Lynx runtime.                                                                                |
| `groupId`             | `number`                  | `7`     | Shared Lynx worker group ID.                                                                                                 |
| `onNativeModulesCall` | `function`                | —       | Callback for native module calls from Lynx runtime.                                                                          |
| `onReady`             | `function`                | —       | Callback when the view has rendered successfully.                                                                            |
| `onError`             | `function`                | —       | Callback when an error occurs during loading or rendering.                                                                   |

### `LunaLynxStage`

Extends `LynxStage` with LUNA theme properties.

| Prop               | Type                      | Default        | Description                                   |
| ------------------ | ------------------------- | -------------- | --------------------------------------------- |
| `lunaTheme`        | `LunaThemeKey`            | `'luna-light'` | LUNA theme key (e.g. `'luna-light'`).         |
| `extraGlobalProps` | `Record<string, unknown>` | —              | Additional global props.                      |
| _(others)_         |                           |                | All `LynxStage` props (except `globalProps`). |

### `MotionStage`

Animated device frame. Extends `Stage`'s base props with spring-driven transitions and a perspective camera model.

`MotionStage` is recommended inside `MotionStageContainer` for responsive sizing and layout animations. When rendered standalone it falls back to its baseline size, and you can override sizing explicitly via the `width` / `height` `MotionValue<number>` props.

#### Props

| Prop                 | Type                            | Default             | Description                                                                      |
| -------------------- | ------------------------------- | ------------------- | -------------------------------------------------------------------------------- |
| `baseWidth`          | `number`                        | `375`               | Design baseline width in pixels.                                                 |
| `baseHeight`         | `number`                        | `812`               | Design baseline height in pixels.                                                |
| `width`              | `MotionValue<number>`           | —                   | Override the viewport width (from context). For advanced cases.                  |
| `height`             | `MotionValue<number>`           | —                   | Override the viewport height (from context). For advanced cases.                 |
| `fit`                | `'contain' \| 'cover'`          | `'contain'`         | Fit mode. Ignored when `fitProgress` is set.                                     |
| `fitProgress`        | `number`                        | —                   | `0–1` blend between contain and cover, driven by a spring.                       |
| `zoom`               | `number`                        | `1`                 | Additional zoom factor.                                                          |
| `panX`               | `number`                        | `0`                 | Screen-space translation along X (px).                                           |
| `panY`               | `number`                        | `0`                 | Screen-space translation along Y (px).                                           |
| `world`              | `{ x?, y?, z? }`                | `{ x:0, y:0, z:0 }` | World-space position. `+Z` toward viewer.                                        |
| `focalLength`        | `number`                        | —                   | Perspective focal length (px). Omit for orthographic.                            |
| `alignX`             | `'left' \| 'center' \| 'right'` | `'center'`          | Horizontal alignment of frame within viewport.                                   |
| `alignY`             | `'top' \| 'center' \| 'bottom'` | `'center'`          | Vertical alignment of frame within viewport.                                     |
| `fitTransition`      | `SpringOptions`                 | —                   | Spring for `fit` / `fitProgress`.                                                |
| `zoomTransition`     | `SpringOptions`                 | —                   | Spring for `zoom`.                                                               |
| `panTransition`      | `SpringOptions`                 | —                   | Spring for combined screen-space translation (`panX/Y` + projected `world.x/y`). |
| `maskColor`          | `string`                        | `'transparent'`     | Overlay mask color.                                                              |
| `maskOpacity`        | `number`                        | `0`                 | Overlay mask opacity (animated).                                                 |
| `contentInteractive` | `boolean`                       | `false`             | Whether the frame's children receive pointer events.                             |
| `className`          | `string`                        | —                   | Applied to the outline layer.                                                    |
| `style`              | `MotionStyle`                   | —                   | Applied to the outline layer.                                                    |

### `MotionStageContainer`

Motion-aware equivalent of `StageContainer`. Provides `MotionValue<number>` width/height to child `MotionStage` components via context. Handles layout animations and extracts the parent scale from `transformTemplate` to keep the visual size accurate during transitions.

Must be used as a child of `<AnimatePresence>` for mount/unmount animations to work.

#### Props

| Prop                        | Type                 | Default | Description                                                             |
| --------------------------- | -------------------- | ------- | ----------------------------------------------------------------------- |
| `layoutId`                  | `string`             | —       | Unique ID for layout animation matching across mount/unmount. Required. |
| `onLayoutMeasure`           | `(box: Box) => void` | —       | Forwarded from `motion`. Called when layout box is measured.            |
| `onLayoutAnimationStart`    | `() => void`         | —       | Forwarded from `motion`. Called when layout animation starts.           |
| `onLayoutAnimationComplete` | `() => void`         | —       | Forwarded from `motion`. Called when layout animation completes.        |

Inherits all `motion.div` props (except `transformTemplate`, which is used internally).

### `MotionPresentation`

A zero-size flex-centered anchor that wraps `AnimatePresence propagate` for descendant mount/unmount animations.

**Use when:** items are dynamically added/removed and need mount/unmount animations.

**Skip when:** components are always mounted, or you only need state transition animations.

Inherits all `motion.div` props (`variants`, `initial`, `animate`, `exit`, `transition`, etc.).

## Usage Examples

### Motion: no mount/unmount

```tsx
import { MotionStage, MotionStageContainer } from '@lynx-js/luna-stage/motion';

<MotionStageContainer className='w-full h-full' layoutId='stage-1'>
  <MotionStage fitProgress={0} zoom={1.2}>
    <YourContent />
  </MotionStage>
</MotionStageContainer>;
```

### Motion: with mount/unmount animations

```tsx
import { AnimatePresence } from 'motion/react';
import {
  MotionStage,
  MotionStageContainer,
  MotionPresentation,
} from '@lynx-js/luna-stage/motion';

const variants = {
  initial: { opacity: 0, x: -300 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 300 },
};

<AnimatePresence mode='popLayout'>
  {items.map(item => (
    <MotionStageContainer key={item.id} layoutId={item.id}>
      <MotionPresentation
        variants={variants}
        initial='initial'
        animate='animate'
        exit='exit'
      >
        <MotionStage world={item.world} focalLength={500}>
          <YourContent />
        </MotionStage>
      </MotionPresentation>
    </MotionStageContainer>
  ))}
</AnimatePresence>;
```

### Perspective carousel

Arrange frames along a circular arc. `+Z` is toward the viewer, so objects at `z < 0` appear further away:

```tsx
const theta = (index - mid) * (Math.PI / 9); // 20° apart
const world = {
  x: Math.sin(theta) * radius,
  z: -Math.cos(theta) * radius, // negative = further from viewer
};

<MotionStage world={world} focalLength={500}>
  <YourContent />
</MotionStage>;
```

### Orthographic compare layout

Omit `focalLength` (or set to `0`) — all frames render at equal scale regardless of `world.z`:

```tsx
<MotionStage world={{ x: offset, y: 0, z: 0 }}>
  <YourContent />
</MotionStage>;
```

## Component Table

| Component              | Entry point | Description                                          |
| ---------------------- | ----------- | ---------------------------------------------------- |
| `Stage`                | `.`         | Static device frame                                  |
| `StageContainer`       | `.`         | Auto-measures container, provides size via context   |
| `LynxStage`            | `./lynx`    | Core Lynx bundle renderer (no LUNA globals)          |
| `LunaLynxStage`        | `./lynx`    | `LynxStage` + LUNA theme prop injection              |
| `MotionStage`          | `./motion`  | Animated device frame with perspective camera        |
| `MotionStageContainer` | `./motion`  | Layout-animated wrapper; provides `MotionValue` size |
| `MotionPresentation`   | `./motion`  | Mount/unmount transition orchestrator                |

## Hooks

| Export                      | Entry point | Description                                        |
| --------------------------- | ----------- | -------------------------------------------------- |
| `useEventCallback`          | `.`         | Stable callback that always calls the latest `fn`  |
| `useIsClient`               | `.`         | SSR-safe client-side mount detection               |
| `useContainerResize`        | `.`         | Observes container dimensions via `ResizeObserver` |
| `useMergedRefs`             | `.`         | Merges multiple refs onto a single element         |
| `useIsomorphicLayoutEffect` | `.`         | SSR-safe `useLayoutEffect`                         |
| `useLynxStage`              | `./lynx`    | Core hook for managing Lynx runtime and lifecycle  |

## SSR / SSG Notes

`LynxStage` and `LunaLynxStage` are **client-only**. They render `null` on the server and mount only after hydration.

## Bundle & Asset Conventions

- By default, bundle files follow the naming pattern `*.web.bundle`.
- `bundleRoot` is normalized to a trailing slash by the default resolver.
- Default resolved URL: `${bundleRoot}${entry}.web.bundle`.
- Use `resolveBundleSrc` when your host needs a different file naming rule or full URL composition.

## Transform Utilities

The functions in `src/utils/transform.ts` are zero-dependency pure functions, safe to copy into other projects.

| Function                                 | Description                                           |
| ---------------------------------------- | ----------------------------------------------------- |
| `computeScaleRange(input)`               | Returns `{ contain, cover }` scale factors            |
| `lerpFitScale(range, t)`                 | Interpolates between contain and cover                |
| `computeFrameOffset(input)`              | Returns `{ offsetX, offsetY }` for CSS transform      |
| `computeDepthScale(focalLength, worldZ)` | Perspective depth scale `f / (f - z)`                 |
| `computeScreenTranslation(input)`        | Projects world XY + screen pan into final translation |

To integrate fit/scale into a `lynx-view` container: copy `computeScaleRange`, `lerpFitScale`, and `computeFrameOffset`. Fix `lynx-view` at `baseWidth × baseHeight`, apply the computed transform via CSS, and pass design-baseline pixel dimensions to `browserConfig` rather than the container's measured size.
