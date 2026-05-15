# lynx-ui-slider SKILL

`lynx-ui-slider` is a primitives-first slider package for ReactLynx. It provides composable building blocks (`SliderRoot`, `SliderTrack`, `SliderIndicator`, `SliderThumb`).

## 1. Core Capabilities

- **Primitives Composition**: Build slider UI with `SliderRoot` + `SliderTrack` + `SliderIndicator` + `SliderThumb`.
- **Shared Base Props**: All primitives inherit `className` and `style` from `ComponentBasicProps`.
- **Controlled & Uncontrolled Modes**: Use `value` + `onValueChange` for controlled mode, or `defaultValue` for uncontrolled mode.
- **Imperative API** (uncontrolled only): Access `updateValue` and `getValue` through `SliderRef`. Throws in controlled mode.
- **RTL Support**: Set `enableRTL` to make the indicator and thumb resolve right-to-left.
- **Stepping**: Set `step` to snap values to discrete increments.
- **Disabled Mode**: Set `disabled` to prevent dragging while still displaying the current value.
- **Interaction Callbacks**: `onDragging(value)` when dragging state changes, `onValueChange(value, source)` for slider-driven updates, `onValueCommit(value)` at drag end.
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
- "Build a headless slider with `step={0.1}` and custom class names for each primitive."
- "Add an RTL slider with `enableRTL` and optional RTL container styling."

## 3. Props Reference

### SliderRootProps

`SliderRootProps`, `SliderTrackProps`, `SliderIndicatorProps`, and `SliderThumbProps` all inherit `className` and `style` from `ComponentBasicProps`.

| Prop            | Type                              | Default | Description                                                                         |
| --------------- | --------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `value`         | `number`                          | —       | Controlled value `[0, 1]`. Do not use with `defaultValue`.                          |
| `defaultValue`  | `number`                          | `0`     | Initial value for uncontrolled mode.                                                |
| `step`          | `number`                          | —       | Snap interval in `[0, 1]`.                                                          |
| `disabled`      | `boolean`                         | `false` | Prevent interaction while keeping the slider value visible.                         |
| `enableRTL`     | `boolean`                         | `false` | Reverse range direction (right-to-left).                                            |
| `onDragging`    | `(value: number) => void`         | —       | Fires when dragging starts and when dragging ends.                                  |
| `onValueChange` | `(value: number, source) => void` | —       | Fires after drag updates and `updateValue` calls. Source is `'drag'` or `'external'`. |
| `onValueCommit` | `(value: number) => void`         | —       | Fires at drag end with final value.                                                 |

### SliderRef (uncontrolled only)

| Method        | Signature                           | Description                                        |
| ------------- | ----------------------------------- | -------------------------------------------------- |
| `updateValue` | `(value: number, options?) => void` | Set value imperatively. Throws in controlled mode. |
| `getValue`    | `() => number`                      | Read current value. Throws in controlled mode.     |

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

**Q: How do I enable RTL?**

A: Pass `enableRTL` to `SliderRoot`. Add `direction: rtl` only if you also want the surrounding container layout or text flow to follow RTL.

**Q: Which primitive should own the fill styling?**

A: `SliderIndicator` is the pure visual fill layer. Keep `SliderThumb` as a sibling inside `SliderTrack`, and style the thumb content independently from the filled portion.

## 5. Sub Components

- **`SliderRoot`**: Owns measurement, drag behavior, value management, and context provider.
- **`SliderTrack`**: Base rail plus the measurement/layout coordinate space for its children.
- **`SliderIndicator`**: Foreground visual indicator with width bound to value. Supports RTL via `right: 0` positioning.
- **`SliderThumb`**: Visual thumb node positioned inside `SliderTrack` by the current ratio.
