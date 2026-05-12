# @lynx-js/lynx-ui-slider

A primitives-first slider component package for lynx-ui.

## Installation

We strongly recommend installing and using this component through the main `@lynx-js/lynx-ui` package:

```bash
# pnpm (recommended)
pnpm add @lynx-js/lynx-ui

# npm
npm install @lynx-js/lynx-ui

# yarn
yarn add @lynx-js/lynx-ui
```

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-slider`)_

## Usage

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Slider)

### Primitive Composition

```tsx
import {
  SliderRoot,
  SliderTrack,
  SliderIndicator,
  SliderThumb,
} from '@lynx-js/lynx-ui'

export function SliderPrimitiveDemo() {
  return (
    <SliderRoot
      defaultValue={0.35}
      onValueChange={(value, source) => console.log(value, source)}
      onValueCommit={(value) => console.log('commit', value)}
    >
      <SliderTrack className='slider-track'>
        <SliderIndicator className='slider-indicator' />
        <SliderThumb className='slider-thumb-wrapper'>
          <view className='slider-thumb-dot' />
        </SliderThumb>
      </SliderTrack>
    </SliderRoot>
  )
}
```

## Component Structure

```tsx
<SliderRoot>
  <SliderTrack>
    <SliderIndicator />
    <SliderThumb>
      <view />
    </SliderThumb>
  </SliderTrack>
</SliderRoot>
```

- **`SliderRoot`**: owns interaction logic and exposes `SliderRef` imperative methods in uncontrolled mode.
- **`SliderTrack`**: establishes the measurement/layout coordinate space and renders the base rail.
- **`SliderIndicator`**: renders the active progress indicator, with width driven by the current ratio.
- **`SliderThumb`**: is positioned inside `SliderTrack` by the current ratio and renders custom thumb content.

Styling for track/thumb size and colors is expected to be done through `className` or inline `style`, instead of dedicated style props.

`SliderIndicator` and `SliderThumb` are siblings inside `SliderTrack`, so the filled region stays purely visual while the thumb position is driven directly by value.

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
