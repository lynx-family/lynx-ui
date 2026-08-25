# @lynx-js/lynx-ui-view-pager

A page-snapped horizontal content navigator for ReactLynx with optional off-screen lazy rendering.

## Installation

```bash
pnpm add @lynx-js/lynx-ui
```

The standalone package is also available as `@lynx-js/lynx-ui-view-pager`.

## Usage

```tsx
import { ViewPager } from '@lynx-js/lynx-ui'

<ViewPager style={{ width: '100%', height: '400px' }}>
  <view style={{ width: '100%', height: '100%' }} />
  <view style={{ width: '100%', height: '100%' }} />
</ViewPager>
```

[View the examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/ViewPager)

## License

[lynx-ui](https://github.com/lynx-family/lynx-ui) is licensed under the [Apache License 2.0](./LICENSE).
