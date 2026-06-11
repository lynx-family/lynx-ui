# lynx-ui-sortable SKILL

`Sortable` is a headless drag-to-reorder list primitive for ReactLynx. It performs reordering on the main thread for smooth, gesture-driven animations and exposes a composable `SortableRoot` / `SortableItem` / `SortableItemArea` API. For massive datasets, prefer `List` or `FeedList`; `Sortable` targets small to medium reorder-able lists.

## 1. Core Capabilities

- **Headless Composition**: Three building blocks — `SortableRoot`, `SortableItem`, and (optional) `SortableItemArea` — let you keep full control of the visual layer.
- **Two Drag Surfaces**: Each `SortableItem` can act as `as='Draggable'` (whole row is the drag surface, default) or `as='DraggableRoot'` (only the inner `SortableItemArea` starts a drag).
- **Owned ScrollView**: Set `as='ScrollView'` on `SortableRoot` to render an internal `<scroll-view>` boundary; pair with `scrollableBoundaryId`, `scrollableStickyUpperOffset`, and `scrollableStickyLowerOffset` to get auto-scroll while dragging near edges.
- **External Boundary**: Use `boundaryId` to point at any element in the page tree as the drop boundary — drags exiting that area are cancelled.
- **Disabled Items (locked rows)**: `<SortableItem disabled>` produces a row that cannot be dragged, cannot be displaced, and **always keeps its absolute position** in the committed order. Other items can freely cross over it; only the relative order of non-disabled items can change.
- **Lifecycle Callbacks**: `onSortStart` and `onSortEnd(sortedData)` on the root. `sortedData` reflects the new order of `SortableData<T>` items, with disabled items pinned at their original indices.
- **Imperative Toggle**: `enableSorting` on the root (`true` by default) globally turns sorting on/off without unmounting items.

## 2. AI Coding Guide

### Minimal Usable Example

`SortableRoot` accepts a render-prop child, **not** static children. Each row is a `SortableItem` whose `sortingKey` MUST match `SortableData.getSortingKey()`.

```tsx
import { useState } from '@lynx-js/react'
import {
  SortableItem,
  SortableItemArea,
  SortableRoot,
  type SortableData,
} from '@lynx-js/lynx-ui'

interface Row { id: string; title: string }

function BasicSortable() {
  const [data, setData] = useState<SortableData<Row>[]>(() =>
    Array.from({ length: 6 }, (_, i) => {
      const id = String(i)
      return {
        dataItem: { id, title: `Row ${i + 1}` },
        getSortingKey: () => id,
      }
    })
  )

  return (
    <SortableRoot
      data={data}
      onSortEnd={setData}
      as='ScrollView'
      scrollableClassName='sortable-scroll'
      scrollableContentClassName='sortable-content'
    >
      {(item) => (
        <SortableItem
          key={item.getSortingKey()}
          sortingKey={item.getSortingKey()}
          as='DraggableRoot'
          className='sortable-row'
        >
          <view className='sortable-row-surface'>
            <text>{item.dataItem.title}</text>
            <SortableItemArea className='sortable-handle'>
              <text>⋮</text>
            </SortableItemArea>
          </view>
        </SortableItem>
      )}
    </SortableRoot>
  )
}
```

### Recommended Prompt Formula

> **Scenario Description** + **Drag Surface (whole row vs handle)** + **Boundary / ScrollView Setup** + **Locked Rows** + **Reorder Callback**

**Example Prompts:**

- "Build a sortable list of 10 cards inside a 360px tall scroll-view. Drag from a small handle on the right of each card; commit reorder via `onSortEnd`."
- "Create a sortable settings list where the first and last rows are locked and never move; other rows can be reordered between them and across them."
- "Render a sortable list with a custom external boundary — only allow dragging within a specific container, and cancel sorting if dragged outside."

## 3. Use Cases & Best Practices

### Whole-row drag surface (default)

```tsx
<SortableItem
  key={item.getSortingKey()}
  sortingKey={item.getSortingKey()}
>
  <MyRowSurface data={item.dataItem} />
</SortableItem>
```

Touching anywhere on the row starts a drag. Best for tile / card layouts.

**Example Path**: `apps/examples/Sortable/Basic/index.tsx`

### Handle-only drag surface

```tsx
<SortableItem
  key={item.getSortingKey()}
  sortingKey={item.getSortingKey()}
  as='DraggableRoot'
>
  <view className='row'>
    <view className='row-content'>{/* tap content */}</view>
    <SortableItemArea className='row-handle'>
      <text>⋮</text>
    </SortableItemArea>
  </view>
</SortableItem>
```

Required when row content has its own gestures (taps, switches). Only `SortableItemArea` starts a drag.

**Example Path**: `apps/examples/Sortable/Basic/index.tsx`

### Owned `ScrollView` with auto-scroll near edges

```tsx
<SortableRoot
  as='ScrollView'
  scrollableBoundaryId='mySortableScroll'
  scrollableClassName='short-scroll-view'
  scrollableContentClassName='sortable-root short-sortable-root'
  scrollableStickyUpperOffset={12}
  scrollableStickyLowerOffset={12}
  data={data}
  onSortEnd={setData}
>
  {renderRow}
</SortableRoot>
```

When the dragged row reaches `12px` from the upper / lower edge, the internal `scroll-view` calls `scrollBy` so the list keeps moving with the drag. Call `lynx.querySelector('#mySortableScroll')?.invoke('scrollBy', { offset })` to scroll programmatically.

**Example Path**: `apps/examples/Sortable/ShortScrollView/index.tsx`

### External boundary (no owned ScrollView)

```tsx
<view id='myBoundary' className='boundary'>
  <SortableRoot data={data} onSortEnd={setData} boundaryId='myBoundary'>
    {renderRow}
  </SortableRoot>
</view>
```

Drags exiting `#myBoundary` are cancelled. Use this when the sortable list is embedded inside an existing scroll container or modal that you control outside `Sortable`.

**Example Path**: `apps/examples/Sortable/NoBoundary/index.tsx`

### Locked rows that never move (`disabled`)

```tsx
const LOCKED = new Set(['0', '5', '7', '11'])

<SortableRoot data={data} onSortEnd={setData} as='ScrollView'>
  {(item) => {
    const isLocked = LOCKED.has(item.getSortingKey())
    return (
      <SortableItem
        key={item.getSortingKey()}
        sortingKey={item.getSortingKey()}
        as='DraggableRoot'
        disabled={isLocked}
      >
        <view className={isLocked ? 'row row--locked' : 'row'}>
          <text>{item.dataItem.title}</text>
          {isLocked
            ? <view className='row-area row-area--locked'><text>Locked</text></view>
            : <SortableItemArea className='row-area'><text>⋮</text></SortableItemArea>}
        </view>
      </SortableItem>
    )
  }}
</SortableRoot>
```

Behavior of a `disabled` row:

- **Cannot be dragged itself.** No touch / longpress is bound; tapping it never starts a sort.
- **Never displaced** by any other row's drag. It always stays at its current screen position.
- **Position preserved in `onSortEnd`.** Its index in the committed `sortedData` is identical to its index in the input `data`. Only the relative order of non-disabled rows can change.
- **Cross-over allowed.** A non-disabled row dragged over a disabled row will skip past it (the disabled row does not move, the dragged row keeps moving), and the swap target on the far side animates with a higher speed so it ends exactly at the dragged row's original slot, with no visual overlap or jump.

Use this for fixed headers/footers, sticky default actions, or rows whose absolute position is part of the design.

**Example Path**: `apps/examples/Sortable/DisableItems/index.tsx`

### Disable sorting globally

```tsx
<SortableRoot data={data} onSortEnd={setData} enableSorting={readOnly === false}>
  {renderRow}
</SortableRoot>
```

`enableSorting={false}` instantly removes drag bindings from every non-disabled item without unmounting. Useful for read-only modes.

**Example Path**: `apps/examples/Sortable/DisableSorting/index.tsx`

## 4. FAQ

**Q: Why is `children` a function in `SortableRoot`?**

A: `Sortable` needs to associate each rendered node with an internal `sortingKey` and ref map. The render-prop signature `(item: SortableData<T>) => ReactNode` makes that wiring explicit and lets `SortableRoot` re-render only the rows whose data identity actually changed.

**Q: Where is the source of truth for the order?**

A: Your application state is. `SortableRoot` is controlled by `data` and reports the committed order through `onSortEnd(sortedData)`. You typically `setData(sortedData)` in the handler. While dragging, only main-thread transforms move; the React `data` does not change until release.

**Q: My handle (`SortableItemArea`) does not start a drag.**

A: Confirm `as='DraggableRoot'` on the surrounding `SortableItem`. With the default `as='Draggable'`, the whole row is the drag surface and `SortableItemArea` is treated as plain content.

**Q: Disabled rows still appear to move during drag.**

A: They should not. If you see this, check that the `disabled` prop is actually `true` for those rows on every render (a stable `Set` via `useMemo` is recommended), and that the row's `sortingKey` is unique and stable across renders. Disabled items are never displaced, never picked as a swap target, and always keep their absolute index in `onSortEnd`.

**Q: How do I make the dragged row visually float above its neighbors?**

A: `Sortable` already raises the dragged row's `z-index` to `10000` while dragging and resets it after release; no extra styling is required.

**Q: Auto-scroll does not happen when I drag near the edges.**

A: Auto-scroll requires either `as='ScrollView'` on `SortableRoot` (so it owns the scroll-view) or a `scrollableBoundaryId` pointing at an existing scrollable element. Plain `as` (default) renders a `view` with no scrolling, so there is nothing to auto-scroll.

**Q: I see a wrong reorder commit when I drag back over a disabled gap and release.**

A: Make sure you are on a version that includes the disabled-aware confirmed-swap reset. If you can still reproduce the case where releasing inside a disabled gap commits a stale swap, see `apps/examples/Sortable/DisableItemsStaleSwap/index.tsx` for the canonical repro and file an issue.

## 5. Sub components

- **`SortableRoot`**: Renders the boundary (plain `view` or owned `<scroll-view>`), owns drag state, and receives `data` / `onSortEnd`.
- **`SortableItem`**: Renders one row. Required props: `sortingKey`. Common props: `as` (`'Draggable'` | `'DraggableRoot'`), `disabled`, `className`.
- **`SortableItemArea`**: Optional inner drag handle. Only meaningful when its parent `SortableItem` is `as='DraggableRoot'`. Style this as the visible drag affordance (e.g. a grip icon).
