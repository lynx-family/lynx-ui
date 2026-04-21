# @lynx-js/lynx-ui-slider

A primitives-first slider component package for lynx-ui.

## Installation

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

### Primitive Composition

```tsx
import {
  SliderRoot,
  SliderTrack,
  SliderRange,
  SliderThumb,
} from '@lynx-js/lynx-ui'

export function SliderPrimitiveDemo() {
  return (
    <SliderRoot
      defaultValue={0.35}
      onValueChange={(value, source) => console.log(value, source)}
      onValueCommit={(value) => console.log('commit', value)}
    >
      <SliderTrack className='slider-track' />
      <SliderRange className='slider-range'>
        <SliderThumb className='slider-thumb-wrapper'>
          <view className='slider-thumb-dot' />
        </SliderThumb>
      </SliderRange>
    </SliderRoot>
  )
}
```

## Component Structure

```tsx
<SliderRoot>
  <SliderTrack />
  <SliderRange>
    <SliderThumb>
      <view />
    </SliderThumb>
  </SliderRange>
</SliderRoot>
```

- **`SliderRoot`**: owns interaction logic and exposes `SliderRef` imperative methods in uncontrolled mode.
- **`SliderTrack`**: renders background track.
- **`SliderRange`**: renders the active progress range and owns its width.
- **`SliderThumb`**: renders thumb content passed through `children`.

Styling for track/thumb size and colors is expected to be done through `className` or inline `style`, instead of dedicated style props.

### About Track/Thumb Centering

The slider internally aligns thumb and track with an implicit size relationship:

- `thumb` vertical center aligns to the track center.
- `thumb` horizontal anchor is the range end center point.

If you override track/thumb sizes with custom CSS, keep this relationship to avoid visual offset:

- progress bar top offset should follow: `(thumbHeight - trackHeight) / 2`
- thumb wrapper right offset should follow: `-thumbWidth / 2`

When these offsets are not updated together with your custom sizes, the thumb may look vertically or horizontally misaligned.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
