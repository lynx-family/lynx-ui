---
name: view-pager
description: Build data-driven, horizontally swipeable page navigation with stable page identity, generated native page containers, optional exposure-based lazy rendering, and imperative navigation.
---

# lynx-ui-view-pager

Use `ViewPager` when a collection of data should render as horizontally swipeable pages. The component generates the required direct native `viewpager-item` children.

```tsx
import { useRef } from '@lynx-js/react'
import { ViewPager } from '@lynx-js/lynx-ui'
import type { ViewPagerRef } from '@lynx-js/lynx-ui'

const pages = [
  { id: 'first', title: 'First page' },
  { id: 'second', title: 'Second page' },
]

export function Pages() {
  const pager = useRef<ViewPagerRef>(null)
  return (
    <ViewPager
      ref={pager}
      data={pages}
      getItemKey={page => page.id}
      itemStyle={{ width: '100%', height: '100%' }}
      style={{ height: '400px' }}
    >
      {page => <text>{page.title}</text>}
    </ViewPager>
  )
}
```

`getItemKey` defaults to the item index. Provide stable, unique values when pages can be inserted, removed, or reordered so page state remains attached to the correct data item. Use `itemClassName` and `itemStyle` to style every generated native item; put page-specific styling and accessibility attributes on the rendered page content.

`initialSelectIndex` applies only at mount. Navigate later with `ref.current?.scrollToPage(index, smooth)`. `onPageChange`, `onPageWillChange`, and `onOffsetChange` receive native events; read payload fields such as the selected index from `event.detail`.

Use `main-thread:onPageChange`, `main-thread:onPageWillChange`, or `main-thread:onOffsetChange` with a `'main thread'` function when the handler must run on the main thread. These props receive the same event shapes as their regular-thread counterparts.

Pages render eagerly unless `lazyOptions.enableLazy` is true. Lazy mode renders the initial page immediately and uses Lynx exposure placeholders for the rest. Give each pager a page-unique `scene`; use `exposureLeft` and `exposureRight` to control how early neighboring pages render. Once rendered, a page stays mounted while its keyed data item remains.

The page renderer receives only `(item, index)`, not selection state. Keep selection-dependent UI outside page content or update it explicitly from `onPageChange`; native swipes do not otherwise require React to rerender the pager's page content.
