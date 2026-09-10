---
name: view-pager
description: Build horizontally swipeable, page-snapped content with composable pages, lazy mounting, and imperative navigation.
---

# lynx-ui-view-pager SKILL

Use `ViewPager` for horizontal paging and `ViewPagerItem` for each native page container.

## Minimal usable example

```tsx
import { useRef } from '@lynx-js/react'
import { ViewPager, ViewPagerItem } from '@lynx-js/lynx-ui'
import type { ViewPagerRef } from '@lynx-js/lynx-ui'

export function Pages() {
  const pager = useRef<ViewPagerRef>(null)
  return (
    <ViewPager ref={pager} style={{ height: '400px' }}>
      <ViewPagerItem key='first'><text>First page</text></ViewPagerItem>
      <ViewPagerItem key='second'><text>Second page</text></ViewPagerItem>
    </ViewPager>
  )
}
```

## Usage guidance

- Give the pager an explicit height. The structural CSS supplies full-width horizontal paging.
- Use direct `ViewPagerItem` children. Arrays and conditional items are supported; fragments and wrapper components are not.
- Give dynamic items stable keys. Keys preserve mounted content; selection follows the numeric position after reordering. Removing the selected last page clamps selection to the new last page.
- Set `initialSelectIndex` for initial selection. Later changes to it are ignored. Navigate with `ref.current?.selectTab(index, smooth)`; animation defaults to true.
- Use `onPageChange(event)` to observe completion, including native swipes. The imperative success callback confirms invocation, not animation completion.
- No IDs or exposure scenes are needed. Optional external IDs belong in `viewpagerProps`.
- Lazy mounting defaults to the selected page and one neighbor on either side. Use `preloadCount={0}` to mount only the selected page and transition destination, or `lazy={false}` to mount all pages. Mounted content remains mounted until its keyed item is removed.
- Style each item through `className` and `style`; use `.ui-selected` for selection styling. Render-prop children receive `{ index, selected }`.
- Put native accessibility attributes in `viewpagerProps` or `itemProps`. Use the dedicated component props for root styles and events.
- Offset events contain page progress, not pixels: the first transition runs from 0 to 1. Main-thread event handlers must be main thread functions.

## Recommended Prompt Formula

Specify the pager dimensions, page content and stable keys, initial selection, navigation controls, and whether all content or only nearby pages should mount initially. Describe per-page styling and accessibility labels separately from navigation behavior.
