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

<ViewPager
  data={[{ id: 'first', title: 'First' }, { id: 'second', title: 'Second' }]}
  getItemKey={page => page.id}
  itemStyle={{ width: '100%', height: '100%' }}
  style={{ width: '100%', height: '400px' }}
>
  {page => <text>{page.title}</text>}
</ViewPager>
```

[View the examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/ViewPager)

Use `getItemProps` when individual native page items need their own style or accessibility attributes. Its styles override matching `itemStyle` properties.

## License

[lynx-ui](https://github.com/lynx-family/lynx-ui) is licensed under the [Apache License 2.0](./LICENSE).
