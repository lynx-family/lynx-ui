---
name: DeferredComponent
description: Use DeferredComponent to delay mounting ReactLynx content by frames, reserve layout space, show a placeholder, and observe layout after the content appears.
---

# lynx-ui-deferred-component SKILL

## Core Capabilities

`DeferredComponent` postpones mounting a child until its wrapper has completed its first layout. It supports additional frame delays and an optional placeholder. Use it when non-critical content should mount after the surrounding page starts laying out.

`LazyComponent` is the component for mounting based on viewport visibility. `DeferredComponent` does not observe visibility or virtualize a collection.

## AI Coding Guide

### Minimal Usable Example

```tsx
import { DeferredComponent } from '@lynx-js/lynx-ui'

function DeferredPanel() {
  return (
    <DeferredComponent
      estimatedStyle={{ width: '100%', minHeight: '120px' }}
      placeholder={<text>Preparing content…</text>}
    >
      <view>
        <text>Content mounted after the first layout.</text>
      </view>
    </DeferredComponent>
  )
}
```

### Recommended Prompt Formula

> **Scenario**: Defer the non-critical `[content]` on a ReactLynx screen.
> **Requirements**: Mount it after `[frame count]` frames and reserve `[estimated dimensions]`.
> **Appearance**: Use `[placeholder content]` during the delay and style the child with `[theme and classes]`.
> **Behavior**: Report `[layout handling]` after the content appears and replay the delay when `[remount condition]` occurs.

## Use Cases and Best Practices

### Choose the delay

- The default `delayFrames={1}` shows children after the first wrapper layout.
- A finite value greater than `1` waits for `delayFrames - 1` animation frames after that initial layout.
- A value below `1` or a non-finite value (`NaN`, `Infinity`, or `-Infinity`) renders children directly. In this mode, there is no wrapper, placeholder, estimated style, or wrapper layout callback.
- Use whole frame counts. The delay follows frame scheduling and is not a fixed duration in milliseconds.

```tsx
<DeferredComponent
  delayFrames={3}
  estimatedStyle={{ width: '100%', minHeight: '160px' }}
  placeholder={<text>Preparing details…</text>}
>
  <Details />
</DeferredComponent>
```

Keep expensive rendering inside the child component. Calculations performed in the parent before creating the child still run immediately.

### Reserve space and observe layout

`estimatedStyle` remains on the wrapper after the child appears. Use a fixed `height` for content with a known final size, or `minHeight` when the content should grow. Apply visual styles to the child and placeholder with their own CSS classes.

```tsx
<DeferredComponent
  estimatedStyle={{ width: '100%', minHeight: '120px' }}
  onLayoutChange={({ width, height }) => {
    console.log(
      `[deferred-panel][onLayoutChange] size, width: ${width}, height: ${height}`,
    )
  }}
>
  <ResizableContent />
</DeferredComponent>
```

`onLayoutChange` receives `{ width, height }` from wrapper layout events after the child appears. The initial event that starts the delay is not forwarded. This callback is not a loading-complete notification; an event depends on layout changing.

### Replay the delay

The child stays mounted after it appears. Unmount and mount `DeferredComponent`, or give it a new React `key`, to restart the placeholder and delay. The [examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/DeferredComponent) use `Button` to demonstrate both patterns.

## FAQ

### Why is my placeholder barely visible?

The default delay is only the initial layout. Use a larger frame count when demonstrating the placeholder; choose production delays based on the screen's needs.

### Why does changing delayFrames not replay an already visible child?

The component preserves its visible state until it is remounted. Change its `key` or unmount it when a new delay is needed.

### Can I call a method through DeferredComponentRef?

`DeferredComponentRef` is an empty reserved interface. It exposes no imperative methods. Use mounting and props to control the component.

## Sub-components and Public Types

`DeferredComponent` has no sub-components. Its public types are `DeferredComponentProps` and `DeferredComponentRef`.
