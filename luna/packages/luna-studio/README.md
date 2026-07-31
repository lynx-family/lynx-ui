# luna-studio

`@lynx-js/luna-studio` is a reusable multi-stage choreography layer for Lynx-based previews and comparison canvases.

> **Note:** `luna-studio` is still experimental, and its API is constantly changing.

It packages the rendering, layout, focus, and interaction plumbing needed for:

- compare / focus / lineup stage arrangements
- shared or per-stage theme application
- host-side stage-container interaction handling
- embedded Lynx runtime callback forwarding
- app-defined focus resolution and global-props injection

It does **not** ship an application shell.

The following app-level pieces stay outside this package:

- `Studio`
- `MenuBar`
- `StudioFrame`
- keyboard shortcut glue
- demo-specific runtime handling
- app-owned layout catalogs and business metadata

If you only need a single device-framed preview, use [`@lynx-js/luna-stage`](../luna-stage) directly.

## Installation

```sh
npm i @lynx-js/luna-studio @lynx-js/web-core motion react
```

`luna-studio` depends on `@lynx-js/luna-stage` internally for its rendering primitives and expects the Lynx Web runtime to be available through `@lynx-js/web-core`.

## Public API

Current public exports from `@lynx-js/luna-studio` are grouped by components and types:

- Components
  - `Choreography`
- Studio model types
  - `StudioStage`
  - `StudioStageSlice`
  - `StudioResolvedStage`
  - `ResolveStudioLayoutParams`
  - `StageGlobalPropsBuilder`
  - `StudioGridSpec`
  - `StudioLayout`
  - `StudioResolvedLayout`
  - `StudioModeGrid`
  - `StudioViewMode`
  - `LunaThemeKey`
  - `LunaThemeMode`
  - `LunaThemeVariant`
- Choreography types
  - `ChoreographyBaseProps`
  - `ChoreographyProps`
  - `ChoreographyInteractionProps`
  - `ChoreographyViewProps`
  - `InteractionParams`
  - `InteractionTarget`
  - `FocusKeyResolver`
  - `StageAppearance`
- Lynx bridge types
  - `LynxRuntimeCall`
- Helpers
  - `resolveStudioLayout`
  - `indexResolvedLayout`
  - `getPayloadString`

`ChoreographyView` and `StudioLynxStage` exist inside the package as internal implementation layers, but they are not part of the public component API.

## Quick Start

```tsx
import { Choreography } from '@lynx-js/luna-studio';
import type { StudioModeGrid, StudioResolvedLayout } from '@lynx-js/luna-studio';

const modeGrid: StudioModeGrid = {
  compare: { cols: 2, rows: 1 },
  focus: { cols: 3, rows: 1 },
  lineup: { cols: 3, rows: 1 },
};

const layout: StudioResolvedLayout = {
  compare: [
    {
      id: 'button-light',
      entry: 'ActButton',
      theme: 'luna-light',
      focusKey: 'button',
      style: { gridColumn: '1 / span 1', gridRow: '1 / span 1' },
    },
    {
      id: 'button-dark',
      entry: 'ActButton',
      theme: 'luna-dark',
      focusKey: 'button',
      style: { gridColumn: '2 / span 1', gridRow: '1 / span 1' },
    },
  ],
  focus: [
    {
      id: 'button-focus',
      entry: 'ActButton',
      theme: 'luna-light',
      focusKey: 'button',
      style: { gridColumn: '2 / span 1', gridRow: '1 / span 1' },
    },
  ],
  lineup: [
    {
      id: 'button-lineup',
      entry: 'ActButton',
      theme: 'lunaris-dark',
      focusKey: 'button',
      style: { gridColumn: '2 / span 1', gridRow: '1 / span 1' },
    },
  ],
};

export function Demo() {
  return (
    <div className='size-full'>
      <Choreography
        bundleRoot='/bundles/'
        layout={layout}
        modeGrid={modeGrid}
        viewMode='compare'
        themeKey='lunaris-dark'
        interactionTarget='content'
      />
    </div>
  );
}
```

If your host prefers an authoring model that separates a resource pool (entry/bundleRoot/theme defaults) from per-mode layout overrides, you can build the resolved layout with `resolveStudioLayout`:

```ts
import { resolveStudioLayout } from '@lynx-js/luna-studio';
import type {
  ResolveStudioLayoutParams,
  StudioLayout,
  StudioStage,
} from '@lynx-js/luna-studio';

const stagePool: Record<string, StudioStage> = {
  Button: { id: 'Button', entry: 'ActButton', theme: 'luna-light' },
};

const layoutSpec: StudioLayout = {
  compare: [{ id: 'Button', style: { gridColumn: '1 / 2', gridRow: '1 / 2' } }],
  focus: [{ id: 'Button', style: { gridColumn: '1 / 2', gridRow: '1 / 2' } }],
  lineup: [{ id: 'Button', style: { gridColumn: '1 / 2', gridRow: '1 / 2' } }],
};

const resolvedLayout = resolveStudioLayout(
  {
    stagePool,
    layoutSpec,
  } satisfies ResolveStudioLayoutParams,
);
```

## Core Concepts

### `StudioStage`

`StudioStage` is the resource/pool definition for a stage (resource locator + defaults).

```ts
type StudioStage = {
  id: string;
  entry: string;
  theme: LunaThemeKey;
  bundleRoot?: string;
  focusKey?: string;
};
```

Notes:

- `entry` and `bundleRoot` are the resource locator used to locate the Lynx bundle.
- `theme` and `focusKey` are stage-level defaults used during layout resolution.

### `StudioResolvedStage`

`StudioResolvedStage` is the per-stage data boundary consumed by the choreography layer.

```ts
type StudioResolvedStage = {
  id: string;
  className?: string;
  style?: CSSProperties;
  bundleRoot?: string;
  focusKey?: string;
  entry: string;
  theme: LunaThemeKey;
};
```

Notes:

- `id` is the stable stage identity used for layout, motion, and interaction correlation.
- `className` and `style` apply to the stage container.
- `bundleRoot` can be provided per-stage; otherwise `Choreography.bundleRoot` may act as a host-level fallback.
- app-specific metadata should live in app-local extension types rather than reopening the public `StudioResolvedStage` contract.

### `StudioStageSlice`

`StudioStageSlice` is the per-mode layout projection for a stage. It references a pool stage by `id` and carries host-side overrides for that mode.

```ts
type StudioStageSlice = {
  id: string;
  className?: string;
  style?: CSSProperties;
  theme?: LunaThemeKey;
  focusKey?: string;
};
```

Notes:

- Slice ids must be unique within the same `StudioViewMode`. `Choreography` uses the resolved `stage.id` as the stable render identity (React key, Motion layout id, and emitted `interaction.stageId`).
- To render the same Lynx `entry` multiple times, define multiple `StudioStage` pool items with different `id` values but the same `entry`.

### `StudioLayout`

`StudioLayout` is the authoring layout specification for the three built-in presentation modes. Each item references a stage by `id` and carries host-side overrides (e.g., `className`, `style`, `theme`, `focusKey`).

```ts
type StudioLayout = Record<
  'compare' | 'focus' | 'lineup',
  StudioStageSlice[]
>;
```

### `StudioResolvedLayout`

`StudioResolvedLayout` contains one stage list for each built-in presentation mode.

```ts
type StudioResolvedLayout = Record<
  'compare' | 'focus' | 'lineup',
  StudioResolvedStage[]
>;
```

`modeGrid` can optionally provide the grid dimensions for each mode when the host wants the container layout to be grid-driven.

### `StudioViewMode`

`StudioViewMode` selects which layout slice is active.

| Mode      | Behavior                                                        |
| --------- | --------------------------------------------------------------- |
| `compare` | Renders multiple stages side-by-side and allows per-stage theme |
| `focus`   | Renders a shared theme with 3D focal emphasis                   |
| `lineup`  | Renders a shared theme in the lineup arrangement                |

## Interaction Model

### `InteractionParams`

`InteractionParams` is the normalized interaction envelope used by choreography callbacks.

```ts
type InteractionParams =
  | {
    target: 'stage';
    stageId: string;
    entry: string;
    payload?: unknown;
    containerEvent: MouseEvent | PointerEvent;
  }
  | {
    target: 'content';
    stageId: string;
    entry: string;
    payload?: unknown;
    runtimeCall: LynxRuntimeCall;
  };
```

Notes:

- `target: 'stage'` means the interaction is attributed to the host-side stage layer; the raw browser payload is exposed as `containerEvent`.
- `target: 'content'` means the interaction is attributed to embedded Lynx content; the raw Lynx runtime payload is exposed as `runtimeCall`.
- `containerEvent.type` distinguishes host-side click / pointer variants.
- `runtimeCall.name` distinguishes content-side interaction kinds emitted through `onNativeModulesCall`.

### `interactionTarget`

`interactionTarget` controls which layer receives pointer interaction first:

- `'content'`: embedded Lynx content is interactive
- `'stage'`: the outer stage container is interactive

### `onInteraction`

Receives the normalized choreography interaction envelope.

```ts
type OnInteraction = (interaction: InteractionParams) => unknown;
```

Use this as the primary high-level callback when you want one place to observe both host-side stage-container interactions and embedded-content runtime callbacks. The concrete raw payload is available as `interaction.containerEvent` or `interaction.runtimeCall`, depending on `interaction.target`.

### `onLynxRuntimeCall`

Receives raw runtime callbacks emitted from embedded Lynx content.

```ts
type OnLynxRuntimeCall = (call: LynxRuntimeCall) => unknown;

type LynxRuntimeCall = {
  entry: string;
  channel: string;
  name: string;
  data: unknown;
};
```

Use this only when you need the original Lynx bridge / RPC callback directly, rather than the normalized `onInteraction` abstraction.

This keeps the package surface runtime-neutral:

- no low-level `moduleName` leak
- `channel` remains the host-facing source identifier
- app-specific interpretation stays outside the package

### `resolveFocusKey`

`resolveFocusKey` maps a normalized interaction back to a stage-level `focusKey`.

```ts
type FocusKeyResolver = (
  interaction: InteractionParams,
) => string | undefined;
```

This is the app-owned bridge between generic choreography interactions and business-specific focus semantics.

### `buildStageGlobalProps`

`buildStageGlobalProps` lets the host derive app-specific Lynx global props for each rendered stage.

```ts
type StageGlobalPropsBuilder = (params: {
  stage: StudioStage;
  viewMode: StudioViewMode;
  activeFocusKey: string;
  focusKey: string | undefined;
}) => Record<string, unknown> | undefined;
```

The two focus-related fields serve different roles:

- `activeFocusKey` is the current choreography-wide active focus identity.
- `focusKey` is the focus identity of the specific `stage` currently being rendered.

In other words, `activeFocusKey` answers "which focus target is currently active?", while `focusKey` answers "which focus target does this particular stage belong to?".

This makes it easy to derive stage-local props such as:

- whether the current stage is the active/focused stage
- which shared component or semantic key is currently active elsewhere in the choreography
- app-specific flags that depend on both the rendered stage and the global focus state

## `Choreography` API

`Choreography` is the main public component in this package.

Internally, it wraps `ChoreographyView`, which is the lower-level renderer responsible for layout, focus state, interaction normalization, and Lynx-stage wiring.

```ts
type ChoreographyProps = Omit<ChoreographyViewProps, 'mode'> & {
  viewMode?: StudioViewMode;
};
```

Behavior notes:

- `viewMode` defaults to `'compare'`
- `themeKey` defaults to `'lunaris-dark'`
- `interactionTarget` defaults to `'content'`
- `focusKey` is read directly from each resolved stage in `layout` (i.e., from the `StudioResolvedLayout` stage items)
- `bundleRoot` can provide a choreography-level fallback; per-stage resource roots are taken from each resolved stage in `layout`
- `layout` is required and should already be fully resolved by the host app

## Scope

This package covers the reusable choreography layer:

- public choreography types and data model
- grid-driven multi-stage layout and focus presentation
- normalized stage/content interaction handling
- the internal `ChoreographyView` renderer
- the internal Lynx runtime adapter used by `Choreography`

This package does **not** provide:

- a top-level `Studio` shell component
- built-in demo layout data
- app chrome such as `MenuBar`
- app-level keyboard bindings
- demo-specific runtime event parsing
- a public `lynx-stage` subpath export

## Intended Consumers

Use `@lynx-js/luna-studio` when you need a reusable multi-stage choreography layer but want to keep your app shell, layout data, business semantics, and event handling local:

- documentation sites embedding multiple Lynx entries
- design system comparison canvases
- host apps that need both stage-container interactions and Lynx runtime callbacks
- future `lynx-website` integration
