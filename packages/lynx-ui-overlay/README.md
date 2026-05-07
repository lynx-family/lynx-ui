# @lynx-js/lynx-ui-overlay

An Overlay component for ReactLynx. It renders content in a native overlay layer above the main view tree.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-overlay`)_

## Usage

Use `OverlayView` when content may need to render in a native overlay container. If `container` is omitted, it falls back to a plain `view`.

```tsx
import { OverlayView } from '@lynx-js/lynx-ui'

export function Example() {
  return (
    <OverlayView container='default'>
      <view className='panel'>
        <text>Overlay content</text>
      </view>
    </OverlayView>
  )
}
```

## Component Structure

The `Overlay` component is composed of the following sub-components:

```tsx
<OverlayView>
  <view />
</OverlayView>
```

- **`OverlayView`**: The main overlay container.

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
