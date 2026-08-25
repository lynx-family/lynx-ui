---
name: ViewPager
description: Build horizontally swipeable, page-snapped content with optional lazy rendering and imperative page selection.
---

# lynx-ui-view-pager SKILL

Use `ViewPager` when content should occupy one page at a time and users should move between pages with a horizontal swipe.

## Minimal usable example

```tsx
import { ViewPager } from '@lynx-js/lynx-ui'

export function Pages() {
  return (
    <ViewPager style={{ width: '100%', height: '400px' }}>
      <view style={{ width: '100%', height: '100%' }} />
      <view style={{ width: '100%', height: '100%' }} />
    </ViewPager>
  )
}
```

## Usage guidance

- Give the pager an explicit width and height.
- Give every child page `width: '100%'` and `height: '100%'`.
- Set `viewpagerId` only when another system needs a stable selector; omitted IDs are generated per instance.
- Use `lazyOptions` to tune or disable off-screen lazy rendering.
- Use a ref and `selectTab(index, smooth)` for imperative page changes.
- Avoid absolute or fixed positioning inside pages unless the content intentionally attaches to the page root.

## Recommended Prompt Formula

When asking an AI agent to build with `ViewPager`, include:

- **Scenario**: Describe the pages and why users swipe between them.
- **Sizing**: Specify the pager dimensions and make every child fill the pager.
- **Navigation**: State whether swiping, imperative `selectTab`, or both are required.
- **Instances**: Provide an explicit `viewpagerId` only when another system needs a stable selector; otherwise the component generates one.
- **Lazy rendering**: State whether to keep the default behavior, disable it, or customize `scene` and exposure margins through `lazyOptions`.
