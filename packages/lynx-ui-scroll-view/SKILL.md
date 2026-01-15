# Lynx UI ScrollView SKILL

`ScrollView` is a general-purpose scroll container used to display content that exceeds the viewport in either vertical or horizontal direction. For massive datasets, prefer `List` or `FeedList` to ensure performance.

## 1. Core Capabilities

- **Vertical and Horizontal Scrolling**: Supports vertical (`scrollOrientation = 'vertical'`) and horizontal (`scrollOrientation = 'horizontal'`) scrolling.
- **BounceableOptions**: Supports edge rubber-band and bounce effects, configurable via:
  - `enableBounces`: enable/disable edge bounce
  - `singleSidedBounce`: select bounce side (`'upper' | 'lower' | 'both'`)
  - `alwaysBouncing`: allow bouncing even when content does not exceed the viewport
  - `startBounceTriggerDistance` / `endBounceTriggerDistance`: threshold distance to trigger `onScrollToBounces`
  - `onScrollToBounces(info)`: callback when reaching upper/lower edge (`info.direction` is `'upper' | 'lower'`)
  - `enableBounceEventInFling`: trigger bounce events during inertial fling
  - `validAnimationVersion`: compatibility switch to use `setTimeout` instead of `requestAnimationFrame` on lower Lynx versions

## 2. AI Coding Guide

### Minimal Usable Example

```tsx
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'

function BasicScrollView() {
  return (
    <ScrollView
      scrollOrientation='vertical'
      style={{ height: '300px', width: '100%' }}
    >
      <view style={{ height: '800px', background: 'lightgray' }}>
        <text>Very long content...</text>
      </view>
    </ScrollView>
  )
}
```

### Wrapper Usage (Flex Layout)

When you need `flex` layout, add a wrapper as the first child of `ScrollView`, and apply `flex` styles on that wrapper:

```tsx
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'

function FlexWrapperExample() {
  return (
    <ScrollView scrollOrientation='vertical' style={{ height: '240px' }}>
      {/* 第一层：wrapper view（设置 flex） */}
      <view style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
        <view
          className='card'
          style={{ width: '100px', height: '100px', background: 'skyblue' }}
        />
        <view
          className='card'
          style={{ width: '100px', height: '100px', background: 'salmon' }}
        />
        <view
          className='card'
          style={{ width: '100px', height: '100px', background: 'khaki' }}
        />
      </view>
    </ScrollView>
  )
}
```

### Recommended Prompt Formula

> **Scenario Description** + **Scroll Configuration (direction, events)** + **Content and Style**

**Example Prompt:**

- "Create a vertically scrollable `ScrollView` with a height of 400px. The content within it has a total height of 1000px."
- "Implement a `ScrollView` that triggers a ‘load more’ function when scrolled to the bottom, using `onScrollToLower`."
- "Create a `ScrollView` and a ‘Back to Top’ button. When the button is clicked, smoothly scroll back to the top."

## 3. Use Cases & Best Practices

### Vertical Scrolling

```tsx
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'

function VerticalScrollView() {
  return (
    <ScrollView scrollY={true} style={{ height: '200px' }}>
      <view style={{ height: '500px' }}>
        {/* ... Long content ... */}
      </view>
    </ScrollView>
  )
}
```

**Example Path**: `apps/examples/src/ScrollView/Basic/index.tsx`

### Horizontal Scrolling

```tsx
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'

function HorizontalScrollView() {
  return (
    <ScrollView scrollOrientation='horizontal' style={{ width: '100%' }}>
      <view style={{ flexDirection: 'row' }}>
        {[...Array(10)].map((_, i) => <view key={i} className='card' />)}
      </view>
    </ScrollView>
  )
}
```

**Example Path**: `apps/examples/src/ScrollView/Basic/index.tsx`

### Listening for Scroll to Bottom (Load More)

```tsx
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'

function LoadMoreScrollView() {
  const loadMore = () => {
    console.log('Reached the bottom, loading more data...')
  }

  return (
    <ScrollView
      scrollY={true}
      style={{ height: '300px' }}
      onScrollToLower={loadMore}
      lower-threshold='50'
    >
      {/* ... list content ... */}
    </ScrollView>
  )
}
```

**Example Path**: `apps/examples/src/ScrollView/Event/index.tsx`

### 4. FAQ

**Q: Why can't my `ScrollView` scroll?**

A: `ScrollView` needs a determined boundary. Set a fixed size (e.g., `height: '300px'`) or place it in a flex container and use `flex: 1`.

**Q: `ScrollView` inside `Popup` causes drag conflicts?**

A: Pass the `main-thread:gesture` object provided by `Popup` to `ScrollView`'s `main-thread:gesture` for proper gesture arbitration.

**Q: Long lists stutter with `ScrollView` + `.map()`?**

A: Use `List` or `FeedList` for large datasets; they provide virtualization and view reuse. `ScrollView` suits limited content scenarios.

**Q: How to implement “Back to Top”?

A: Maintain a scroll position state and programmatically set `scroll-top` (or use native APIs) on interaction.

**Q: How to use flex layout inside `ScrollView`?**

A: The first-level direct child of `ScrollView` is constrained to `display: linear`. If you need `flex`, add a wrapper `view` as the first child and apply all flex-related styles to that wrapper.

## 5. Sub components

`ScrollView` is a container component. Its direct child elements are the scrollable content. There are no named child components.
