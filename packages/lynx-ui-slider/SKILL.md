# lynx-ui-slider SKILL

`lynx-ui-slider` is a primitives-first slider package for ReactLynx. It provides composable building blocks (`SliderRoot`, `SliderTrack`, `SliderIndicator`, `SliderThumb`) for single-value and two-thumb range selection.

## 1. Core Capabilities

- **Primitives Composition**: Build slider UI with `SliderRoot` + `SliderTrack` + `SliderIndicator` + `SliderThumb`.
- **Range Selection**: Pass a `[lower, upper]` tuple and render thumbs with `index={0}` and `index={1}`.
- **Shared Base Props**: All primitives inherit `className` and `style` from `ComponentBasicProps`.
- **Controlled & Uncontrolled Modes**: Use `value` + `onValueChange` for controlled mode, or `defaultValue` for uncontrolled mode, with either a number or range tuple.
- **Imperative API** (uncontrolled only): Access `updateValue` and `getValue` through `SliderRef<Value>`. Use its default `number` shape for a single value or `SliderRef<SliderRangeValue>` for a range. Throws in controlled mode.
- **RTL Support**: Set `enableRTL` to make the indicator and thumb resolve right-to-left.
- **Stepping**: Set `step` to snap values to discrete increments.
- **Disabled Mode**: Set `disabled` to prevent dragging while still displaying the current value.
- **Interaction Callbacks**: `onDragging(value)` when dragging state changes, `onValueChange(value, source)` for slider-driven updates, `onValueCommit(value)` at drag end.
- **Ordered Range Dragging**: Lower and upper thumbs may meet but cannot cross during a drag.
- **Headless Styling**: Supports styling via `className` and `style` props on every primitive.

## 2. AI Coding Guide

### Minimal Usable Example (Uncontrolled)

```tsx
import {
  SliderRoot,
  SliderTrack,
  SliderIndicator,
  SliderThumb,
} from '@lynx-js/lynx-ui'

function BasicSlider() {
  return (
    <SliderRoot
      defaultValue={0.3}
      onValueCommit={(value) => console.log(value)}
    >
      <SliderTrack className='track'>
        <SliderIndicator className='indicator' />
        <SliderThumb className='thumb'>
          <view />
        </SliderThumb>
      </SliderTrack>
    </SliderRoot>
  )
}
```

### Controlled Mode Example

```tsx
import { useState } from '@lynx-js/react'
import {
  SliderRoot,
  SliderTrack,
  SliderIndicator,
  SliderThumb,
} from '@lynx-js/lynx-ui'

function ControlledSlider() {
  const [value, setValue] = useState(0.5)

  return (
    <SliderRoot
      value={value}
      onValueChange={(v) => setValue(v)}
    >
      <SliderTrack className='track'>
        <SliderIndicator className='indicator' />
        <SliderThumb className='thumb'>
          <view />
        </SliderThumb>
      </SliderTrack>
    </SliderRoot>
  )
}
```

### Controlled Range Example

```tsx
import { useState } from '@lynx-js/react'
import {
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from '@lynx-js/lynx-ui'
import type { SliderRangeValue } from '@lynx-js/lynx-ui'

function ControlledRangeSlider() {
  const [range, setRange] = useState<SliderRangeValue>([0.2, 0.8])

  return (
    <SliderRoot value={range} onValueChange={setRange}>
      <SliderTrack className='track'>
        <SliderIndicator className='indicator' />
        <SliderThumb index={0} className='thumb'>
          <view />
        </SliderThumb>
        <SliderThumb index={1} className='thumb'>
          <view />
        </SliderThumb>
      </SliderTrack>
    </SliderRoot>
  )
}
```

Use `index={0}` only for the lower thumb and `index={1}` only for the upper
thumb. `SliderIndicator` automatically spans between the two values. Input
tuples are sorted, clamped to `[0, 1]`, and snapped to `step`; an active thumb
is constrained by the other thumb and cannot cross it.

### RTL Example

```tsx
<SliderRoot enableRTL defaultValue={0.4}>
  <SliderTrack className='track'>
    <SliderIndicator className='indicator' />
    <SliderThumb className='thumb'>
      <view />
    </SliderThumb>
  </SliderTrack>
</SliderRoot>
```

### Recommended Prompt Formula

> **State mode** + **Visual structure** + **Interaction callbacks** + **Styling hooks**

**Example Prompts:**

- "Create a controlled slider with custom thumb UI and `onValueCommit` callback."
- "Build a controlled price-range slider with indexed lower and upper thumbs."
- "Build a headless slider with `step={0.1}` and custom class names for each primitive."
- "Add an RTL slider with `enableRTL` and optional RTL container styling."

## 3. Props Reference

### SliderRootProps<Value>

`SliderRootProps`, `SliderTrackProps`, `SliderIndicatorProps`, and `SliderThumbProps` all inherit `className` and `style` from `ComponentBasicProps`.

`Value` is either `number` or `SliderRangeValue`. It defaults to `number` for existing single-value usage and is inferred automatically from `value` or `defaultValue`.

| Prop            | Type                             | Default | Description                                                                           |
| --------------- | -------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| `value`         | `Value`                          | —       | Controlled value. Do not use with `defaultValue`.                                     |
| `defaultValue`  | `Value`                          | `0`     | Initial uncontrolled value. Range usage must provide a tuple here or through `value`. |
| `step`          | `number`                         | —       | Snap interval in `[0, 1]`.                                                            |
| `disabled`      | `boolean`                        | `false` | Prevent interaction while keeping the slider value visible.                           |
| `enableRTL`     | `boolean`                        | `false` | Reverse slider direction (right-to-left).                                              |
| `onDragging`    | `(value: Value) => void`         | —       | Fires when dragging starts and when dragging ends.                                    |
| `onValueChange` | `(value: Value, source) => void` | —       | Fires after slider-driven updates. Source is `'drag'` or `'external'`.                 |
| `onValueCommit` | `(value: Value) => void`         | —       | Fires at drag end with the final value.                                               |

For explicit annotations, use `SliderRootProps` for a single value and `SliderRootProps<SliderRangeValue>` for a range. Both shapes use the same component and callbacks.

### SliderRef<Value> (uncontrolled only)

| Method        | Signature                          | Description                                        |
| ------------- | ---------------------------------- | -------------------------------------------------- |
| `updateValue` | `(value: Value, options?) => void` | Set value imperatively. Throws in controlled mode. |
| `getValue`    | `() => Value`                      | Read current value. Throws in controlled mode.     |

Use `SliderRef` for a single value and `SliderRef<SliderRangeValue>` for a range.

### SliderThumbProps in range mode

Single-value sliders use the default `index={0}`. For a range, set `index={0}` on the lower thumb and `index={1}` on the upper thumb.

### SliderUIVariants

Slider primitives receive `ui-disabled` when disabled. During interaction,
the root, track, and indicator receive `ui-active`; only the thumb being moved
receives `ui-active` in range mode.

## 4. FAQ

**Q: Should I use controlled or uncontrolled mode?**

A: Use controlled (`value` + `onValueChange`) when you need to sync slider state with external state. Use uncontrolled (`defaultValue`) for simpler cases where internal state suffices.

**Q: What is the difference between `onDragging`, `onValueChange`, and `onValueCommit`?**

A: `onDragging` fires when dragging starts and when dragging ends. `onValueChange` fires after slider-driven value updates during drag and imperative `updateValue` calls. `onValueCommit` fires once at drag end — useful for persisting the final value.

**Q: How do I prevent user interaction while still showing the value?**

A: Set `disabled` on `SliderRoot`. The slider will display the current value but will not respond to touch or pointer events.

**Q: What happens if I call `updateValue` / `getValue` in controlled mode?**

A: They will throw an error. In controlled mode, update external state through `onValueChange` so the `value` prop stays in sync with the rendered value.

**Q: Can I set value outside `[0, 1]`?**

A: Input values are clamped to `[0, 1]` internally.

**Q: How do I create a two-thumb range slider?**

A: Pass a `[lower, upper]` tuple to `value` or `defaultValue`, then render two `SliderThumb` primitives with `index={0}` and `index={1}`. The indicator fills the selected interval.

**Q: Can the lower and upper thumbs cross?**

A: No. A dragged thumb is clamped to the other value. The two thumbs may meet,
but their lower/upper identities remain stable: the active thumb does not swap
with or push the other thumb. This non-crossing policy is the stable default.

**Q: How do I enable RTL?**

A: Pass `enableRTL` to `SliderRoot`. Add `direction: rtl` only if you also want the surrounding container layout or text flow to follow RTL.

**Q: Which primitive should own the fill styling?**

A: `SliderIndicator` is the pure visual fill layer. Keep `SliderThumb` as a sibling inside `SliderTrack`, and style the thumb content independently from the filled portion.

## 5. Sub Components

- **`SliderRoot`**: Owns measurement, drag behavior, value management, and context provider.
- **`SliderTrack`**: Base rail plus the measurement/layout coordinate space for its children.
- **`SliderIndicator`**: Foreground visual indicator from the origin to a single value, or between both range values. Supports RTL.
- **`SliderThumb`**: Visual thumb node positioned inside `SliderTrack`; use `index` to identify both range endpoints.
