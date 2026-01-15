# Lynx UI FeedList SKILL

`FeedList` is a high-performance feed stream list component, built upon `List`. It encapsulates common feed scenarios such as **pull-to-refresh** and **load more**, allowing developers to quickly build feed list pages.

Note: Use `FeedList` only when you need pull-to-refresh and load-more behaviors. For regular virtual lists without these features, prefer using `List` directly.

## 1. Core Capabilities

- **High-Performance Virtual List**: Inherits all the performance features of `List`, including virtual scrolling and multi-layout support (`single`, `flow`, `waterfall`).
- **Pull-to-Refresh**: Enable via `refreshOptions`, supports custom refresh headers.
- **Load More**: Use `onScrollToLower`, `loadMoreFooter`, and `noMoreDataFooter` to implement pagination states.
- **Gesture Coordination**: Coordinate gestures with parent containers (like `Popup`) via `main-thread:gesture`.

## 2. AI Coding Guide

### Minimal Usable Example

When using `FeedList`, you **MUST** provide `listId` and `listType`, and use `<list-item>` as the direct child. To enable pull-to-refresh and load more, you also need to configure the corresponding props and get the instance via `ref` to control the state.

```tsx
import { useRef } from '@lynx-js/react'
import { FeedList, FeedListRef } from '@lynx-js/lynx-ui-feed-list'

function BasicFeedList() {
  const feedListRef = useRef<FeedListRef>(null)
  const items = Array.from({ length: 20 }, (_, i) => `Item ${i}`)

  const handleRefresh = () => {
    console.log('Refreshing...')
    setTimeout(() => {
      feedListRef.current?.finishRefresh()
    }, 2000)
  }

  const handleLoadMore = () => {
    console.log('Loading more...')
    // After loading, you might need to call feedListRef.current?.changeHasMoreStatus(false);
  }

  return (
    <FeedList
      ref={feedListRef}
      listId='my-feed-list'
      listType='single'
      refreshOptions={{ onRefresh: handleRefresh }}
      onScrollToLower={handleLoadMore}
      style={{ width: '100%', height: '500px' }}
    >
      {items.map(item => (
        <list-item item-key={item} key={item}>
          <view style={{ height: '60px' }}>{item}</view>
        </list-item>
      ))}
    </FeedList>
  )
}
```

### Recommended Prompt Formula

> **Scenario Description** + **Layout Configuration** + **Refresh and Load More Logic** + **Custom UI**

**Example Prompt:**

- "Create a single-column `FeedList`. When pulled down, it triggers a refresh operation, and the refresh animation should be stopped after 2 seconds."
- "Implement a two-column grid `FeedList`. When scrolled to the bottom, it triggers a load more function. When there is no more data, display a ‘No more data’ footer."
- "Customize the pull-to-refresh header of `FeedList` to be a Lottie animation."

## 3. Use Cases & Best Practices

### Basic Feed Stream List

A list with pull-to-refresh and load more functionality.

```tsx
import { useRef, useState } from '@lynx-js/react';
import { FeedList, FeedListRef } from '@lynx-js/lynx-ui-feed-list';

function FullFeaturedFeedList() {
  const listRef = useRef<FeedListRef>(null);
  const [items, setItems] = useState([...]);
  const [hasMore, setHasMore] = useState(true);

  const onRefresh = async () => {
    const newData = await fetchNewData();
    setItems(newData);
    listRef.current?.finishRefresh();
    setHasMore(true); // Reset hasMore status on refresh
    listRef.current?.changeHasMoreStatus(true);
  };

  const onLoadMore = async () => {
    if (!hasMore) return;
    const moreData = await fetchMoreData();
    if (moreData.length > 0) {
      setItems([...items, ...moreData]);
    } else {
      setHasMore(false);
      listRef.current?.changeHasMoreStatus(false);
    }
  };

  return (
    <FeedList
      ref={listRef}
      listId="feed"
      listType="single"
      refreshOptions={{ onRefresh }}
      onScrollToLower={onLoadMore}
      loadMoreFooter={<text>Loading...</text>}
      noMoreDataFooter={<text>-- End --</text>}
    >
      {/* ... list-items ... */}
    </FeedList>
  );
}
```

**Example Path**: `apps/examples/src/FeedList/Basic/index.tsx`

### Grid Layout Feed

Combine `listType: 'flow'` to create a feed in a grid layout.

```tsx
<FeedList
  listId='grid-feed'
  listType='flow'
  spanCount={2}
  {...otherProps}
>
  {/* ... */}
</FeedList>
```

**Example Path**: `apps/examples/src/FeedList/Grid/index.tsx`

### Managing Footer State

FeedList displays two footer variants:

- `loadMoreFooter`: shown when there is more data to load
- `noMoreDataFooter`: shown when all data has been loaded

Footers are controlled exclusively via `ref.current.changeHasMoreStatus(hasMore)`. They are not linked to refresh status or diff results.

```tsx
import { useRef, useState } from '@lynx-js/react'
import { FeedList, FeedListRef } from '@lynx-js/lynx-ui-feed-list'

function FooterStateExample() {
  const listRef = useRef<FeedListRef>(null)
  const [hasMore, setHasMore] = useState(true)

  const onScrollToLower = () => {
    // fetch more...
    const more = await fetchMore()
    if (more.length === 0) {
      setHasMore(false)
      listRef.current?.changeHasMoreStatus(false) // switch to noMoreDataFooter
    }
  }

  const onRefresh = async () => {
    // refresh resets footer state if needed
    setHasMore(true)
    listRef.current?.changeHasMoreStatus(true) // back to loadMoreFooter
    listRef.current?.finishRefresh()
  }

  return (
    <FeedList
      ref={listRef}
      listId='feed'
      listType='single'
      refreshOptions={{ onRefresh }}
      onScrollToLower={onScrollToLower}
      loadMoreFooter={<text>Loading…</text>}
      noMoreDataFooter={<text>-- End --</text>}
    >
      {/* ... list-items ... */}
    </FeedList>
  )
}
```

### 4. FAQ

**Q: After triggering `onRefresh`, the refresh header persists. What should I do?**

A: `FeedList` does not automatically end the refresh animation. Call `ref.current.finishRefresh()` after your data request completes; otherwise, the refresh header remains visible.

**Q: After loading all data, the load more footer is still displayed. How do I stop it?**

A: Call `ref.current.changeHasMoreStatus(false)` to indicate there is no more data, and display `noMoreDataFooter` instead of `loadMoreFooter`.

**Q: When should I use `FeedList` vs `List`?**

A: Use `FeedList` only when you need pull-to-refresh and load-more behaviors. For regular virtual lists without these features, prefer using `List` directly.

## 5. Sub components

- **`<list-item>`**: This is a built-in tag, not a React component provided by `lynx-ui`. It must be the direct child of `FeedList` and must have a unique `item-key` and `key` property. All content for a list item should be placed inside this tag.
