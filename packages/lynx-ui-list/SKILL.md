# lynx-ui-list SKILL

## 1. Core Capabilities

- **Virtual Scrolling**: **List** and **FeedList** is the **only two** scroll container that can only renders visible items, ensuring smooth scrolling performance even with **massive** amounts of data. If the count of children has more than 10 items, you **MUST** use **List** or **FeedList**.
- **Multiple Layouts**: Supports three layout modes: `single` (single-column list), `flow` (multi-column grid layout), and `waterfall` (multi-column waterfall layout). **FeedList** is the **only** scroll container that supports multi-column layout.
- **Required Height**: `List` **MUST** have an explicit measurable height on the component itself. Both CSS `height` applied through `className` and inline `style.height` are supported. When using a percentage height, ensure the parent has a definite height. Do not rely on `flex: 1` alone.

## 2. AI Coding Guide

### Minimal Usable Example

When using `List`, you must provide a unique `listId`, specify the `listType`, and use `<list-item>` as the direct child. Each `<list-item>` **MUST** have a unique `item-key` and **MUST** also set a `key` prop. These two keys serve different purposes and both are required.

Runtime constraints:

- Provide an explicit, measurable height for `List`, either with CSS `height` applied through `className` or with inline `style.height`. When using a percentage height, ensure the parent has a definite height.
- Do not use `flex: 1` as the only boundary for `List`.

```tsx
import { List } from '@lynx-js/lynx-ui'

function BasicList() {
  const items = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`)

  return (
    <List
      listId='my-unique-list'
      listType='single'
      spanCount={1}
      style={{ width: '100%', height: '400px' }}
    >
      {items.map(item => (
        <list-item item-key={item} key={item}>
          <view style={{ height: '50px', borderBottom: '1px solid #eee' }}>
            <text>{item}</text>
          </view>
        </list-item>
      ))}
    </List>
  )
}
```

### Recommended Prompt Formula

> **Scenario Description** + **Layout Type and Configuration** + **Data and Item Content** + **Interaction Requirement**

**Example Prompt:**

- "Create a single-column virtual list to display 1000 data items. Each item has a height of 60px."
- "Implement a two-column grid layout using `List`. The data items are images."
- "Create a waterfall layout `List`. When the list is scrolled to the bottom, trigger a ‘load more’ function."

## 3. Use Cases & Best Practices

### Single-column List (single)

The most basic list form.

```tsx
import { List } from '@lynx-js/lynx-ui';
import './index.css';

function SingleColumnList() {
  const data = [...];
  return (
    <List listId="single-list" listType="single" className="lynx-ui-list__viewport">
      {data.map(item => (
        <list-item item-key={item.id} key={item.id}>
          <MyListItem data={item} />
        </list-item>
      ))}
    </List>
  );
}
```

The height in this example comes from the CSS class in `index.css`:

```css
.lynx-ui-list__viewport {
  height: 400px;
}
```

`BasicList` above uses inline `style.height`. Both approaches define the List height.

**Example Path**: `apps/examples/src/List/Layouts/index.tsx`

### Grid Layout (flow)

Set `listType` to `flow` and specify `spanCount` to create a grid layout.

```tsx
import { List } from '@lynx-js/lynx-ui';

function GridLayout() {
  const data = [...];
  return (
    <List
      listId="grid-list"
      listType="flow"
      spanCount={3} // 3 columns
      mainAxisGap={10} // Vertical gap
      crossAxisGap={10} // Horizontal gap
      style={{ height: '400px' }}
    >
      {/* ... list-items ... */}
    </List>
  );
}
```

**Example Path**: `apps/examples/src/List/Layouts/index.tsx`

### Waterfall Layout (waterfall)

Set `listType` to `waterfall` for an unequal-height column layout.

```tsx
import { List } from '@lynx-js/lynx-ui';

function WaterfallList() {
  const data = [...]; // Data items usually have different heights
  return (
    <List
      listId="waterfall-list"
      listType="waterfall"
      spanCount={2} // 2 columns
      style={{ height: '400px' }}
    >
      {/* ... list-items ... */}
    </List>
  );
}
```

**Example Path**: `apps/examples/src/List/Layouts/index.tsx`

### Content-adaptive Size Limits

Use an explicit height for a normal `List` viewport. When short content should shrink the container and long content should stop at a limit, use `listMaxSize` (a number in px). It limits height for vertical lists and width for horizontal lists. Define the horizontal list's height separately through CSS `height` or `style.height`.

### 4. FAQ

**Q: Do I need to set `listId`, and does it have to be unique?**

A: Yes. `listId` is the unique identifier used by the native layer to track a `List` instance. You must ensure every `List` on the same page has a different `listId`.

**Q: Why does my `List` warn about children or reuse keys?**

A: The direct child of `List` must be `<list-item>`, and each `<list-item>` must have a unique `item-key`. The virtual list mechanism and reuse strategy depend on `item-key` to correctly recycle and render items.

**Q: Do I need both React `key` and `item-key`?**

A: Yes. `item-key` is consumed by the native virtualization engine to identify and recycle items; React’s `key` is used by React’s reconciliation to track element identity. They may share the same value, but you must provide both.

**Q: Why can’t my `List` scroll or render correctly?**

A: `List` needs an explicit measurable height on the component itself to calculate visible items. Provide CSS `height` applied through `className` or inline `style.height`, using fixed or viewport units, or a percentage when the parent has a definite height. `flex: 1` alone is not sufficient.

**Q: How do `listType` and `spanCount` relate?**

A: `single` ignores `spanCount` (single column). `flow` and `waterfall` require `spanCount` ≥ 1 to define the number of columns. `flow` assumes relatively equal item heights; `waterfall` supports uneven heights (masonry-style).

**Q: What do `mainAxisGap` and `crossAxisGap` control?**

A: They control spacing between items. For vertical lists, `mainAxisGap` is the vertical gap and `crossAxisGap` is the horizontal gap. These are most relevant for multi-column layouts (`flow`, `waterfall`).

**Q: How should I implement “load more” correctly?**

A: Use `onScrollToLower` to trigger pagination. Keep `item-key` stable when appending data, avoid heavy computations in scroll callbacks, and debounce network requests to prevent jank.

**Q: My `onScroll` feels laggy—how to optimize?**

A: Avoid expensive work in `onScroll`. Throttle the handler, move heavy logic off the UI thread, and prefer `onScrollToLower`/`onScrollToUpper` for coarse-grained triggers.

**Q: Can I set CSS `max-height` directly?**

A: For a normal `List` viewport, set an explicit CSS `height` or `style.height`; CSS `max-height` alone does not define the viewport height. For content-adaptive sizing with a maximum limit, use `listMaxSize` as described in Content-adaptive Size Limits above.

**Q: When should I use `FeedList` instead of `List`?**

A: Use `FeedList` if you need refresh or loadmore footer. Otherwise, use `List` for simple virtual lists.

**Q: How do I make `List` fill remaining space in a flex layout?**

A: Give the parent a definite height, then set CSS `height: 100%` or `style={{ height: '100%' }}` on `List`. Do not rely on `flex: 1` on `List` or its wrapper as the only boundary.

## 5. Sub components

- **`<list-item>`**: This is a built-in tag, not a React component provided by `lynx-ui`. It must be the direct child of `List` and must have a unique `item-key` property. All content for a list item should be placed inside this tag.
