# lynx-ui-slider SKILL

`lynx-ui-slider` is a primitives-first slider package for ReactLynx. It provides composable building blocks (`SliderRoot`, `SliderTrack`, `SliderRange`, `SliderThumb`).

## 1. Core Capabilities

- **Primitives Composition**: Build slider UI with `SliderRoot` + `SliderTrack` + `SliderRange` + `SliderThumb`.
- **Shared Base Props**: All primitives inherit `className` and `style` from `ComponentBasicProps`.
- **Controlled & Uncontrolled Modes**: Use `value` + `onValueChange` for controlled mode, or `defaultValue` for uncontrolled mode.
- **Imperative API** (uncontrolled only): Access `updateValue` and `getValue` through `SliderRef`. Throws in controlled mode.
- **RTL Support**: Set `enableRTL` to reverse range direction (right-to-left).
- **Stepping**: Set `step` to snap values to discrete increments.
- **Readonly Mode**: Set `readonly` to prevent dragging while still displaying the current value.
- **Interaction Callbacks**: `onDragging(value)` when dragging starts, `onValueChange(value, source)` for slider-driven updates, `onValueCommit(value)` at drag end.
- **Headless Styling**: Supports styling via `className` and `style` props on every primitive.

## 2. AI Coding Guide

### Minimal Usable Example (Uncontrolled)

```tsx
import {
  SliderRoot,
  SliderTrack,
  SliderRange,
  SliderThumb,
} from '@lynx-js/lynx-ui'

function BasicSlider() {
  return (
    <SliderRoot
      defaultValue={0.3}
      onValueCommit={(value) => console.log(value)}
    >
      <SliderTrack className='track' />
      <SliderRange className='range'>
        <SliderThumb className='thumb'>
          <view />
        </SliderThumb>
      </SliderRange>
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
  SliderRange,
  SliderThumb,
} from '@lynx-js/lynx-ui'

function ControlledSlider() {
  const [value, setValue] = useState(0.5)

  return (
    <SliderRoot
      value={value}
      onValueChange={(v) => setValue(v)}
    >
      <SliderTrack className='track' />
      <SliderRange className='range'>
        <SliderThumb className='thumb'>
          <view />
        </SliderThumb>
      </SliderRange>
    </SliderRoot>
  )
}
```

### RTL Example

```tsx
<SliderRoot enableRTL defaultValue={0.4}>
  <SliderTrack className='track' />
  <SliderRange className='range'>
    <SliderThumb className='thumb'>
      <view />
    </SliderThumb>
  </SliderRange>
</SliderRoot>
```

### Recommended Prompt Formula

> **State mode** + **Visual structure** + **Interaction callbacks** + **Styling hooks**

**Example Prompts:**

- "Create a controlled slider with custom thumb UI and `onValueCommit` callback."
- "Build a headless slider with `step={0.1}` and custom class names for each primitive."
- "Add an RTL slider with `enableRTL` and `direction: rtl` CSS."

## 3. Props Reference

### SliderRootProps

`SliderRootProps`, `SliderTrackProps`, `SliderRangeProps`, and `SliderThumbProps` all inherit `className` and `style` from `ComponentBasicProps`.

| Prop            | Type                              | Default | Description                                                                         |
| --------------- | --------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `value`         | `number`                          | —       | Controlled value `[0, 1]`. Do not use with `defaultValue`.                          |
| `defaultValue`  | `number`                          | `0`     | Initial value for uncontrolled mode.                                                |
| `step`          | `number`                          | —       | Snap interval in `[0, 1]`.                                                          |
| `readonly`      | `boolean`                         | `false` | Prevent interaction while keeping the slider value visible.                         |
| `enableRTL`     | `boolean`                         | `false` | Reverse range direction (right-to-left).                                            |
| `onDragging`    | `(value: number) => void`         | —       | Fires once when the interaction enters dragging state.                              |
| `onValueChange` | `(value: number, source) => void` | —       | Fires for drag updates and `updateValue` calls. Source is `'drag'` or `'external'`. |
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

A: `onDragging` fires once when dragging starts. `onValueChange` fires for slider-driven value updates during drag and imperative `updateValue` calls. `onValueCommit` fires once at drag end — useful for persisting the final value.

**Q: Is `disabled` still supported?**

A: Use `readonly` going forward. `disabled` is kept only as a deprecated compatibility alias.

**Q: What happens if I call `updateValue` / `getValue` in controlled mode?**

A: They will throw an error. In controlled mode, update the `value` prop directly instead.

**Q: Can I set value outside `[0, 1]`?**

A: Input values are clamped to `[0, 1]` internally.

**Q: How do I enable RTL?**

A: Pass `enableRTL` to `SliderRoot` and add `direction: rtl` to the container CSS.

**Q: I changed thumb/track size in CSS and now thumb is not centered. Why?**

A: Thumb and track have an implicit centering relationship. If you change one size, also update the matching offsets in CSS:

- vertical alignment offset: `(thumbHeight - trackHeight) / 2`
- horizontal anchor offset: `-thumbWidth / 2`

## 5. Sub Components

- **`SliderRoot`**: Owns measurement, drag behavior, value management, and context provider.
- **`SliderTrack`**: Background track bar.
- **`SliderRange`**: Foreground range container with width bound to value. Supports RTL via `right: 0` positioning.
- **`SliderThumb`**: Draggable thumb visual node, positioned at the end of the range.
