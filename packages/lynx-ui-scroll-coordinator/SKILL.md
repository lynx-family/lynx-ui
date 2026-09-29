---
name: scroll-coordinator
description: Coordinate a collapsible header and persistent toolbar with nested lists, vertical scroll views, or paged content, including whole-page and per-page pull-to-refresh.
---

# lynx-ui-scroll-coordinator

Import `ScrollCoordinator` and `ScrollCoordinatorRef` from `@lynx-js/lynx-ui`. Give the component a bounded height and put a vertical `List`, `ScrollView`, or `ViewPager` of lists in `slot`. The component generates `scroll-coordinator`, `scroll-coordinator-header`, `scroll-coordinator-toolbar`, and `scroll-coordinator-slot` native elements.

## Composition

`headers` contains the collapsible content. `toolbar` stays visible; the collapse distance is header height minus toolbar height. A toolbar can overlay the header, so reserve room for it in your header layout. Use a `scroll-coordinator-slot-drag` with `enable-drag={false}` around tabs when vertical drags on the tabs should not collapse the header.

`className` and `style` size and style the outermost element. With a `refreshOptions` object, this is the `refresh` wrapper. Otherwise it is the native coordinator. All structural styles are minimal; style supplied content with your own design system. `.ui-sticky` is applied to the coordinator and its optional outer refresh wrapper at the sticky threshold.

## Refresh

For whole-page refresh, provide `refreshOptions={{ enableRefresh: true, headerContent, onStartRefresh }}`. Its callback names and payloads match FeedList, with an independent native implementation and no `mode` option. Use `startRefresh()` to trigger a refresh and always call `finishRefresh()` after the operation settles, including failures. Returning a promise does not finish the animation automatically.

Disable `bounces` on Lists inside a whole-page refresh coordinator so the outer refresh owns the pull gesture and rebound.

Give `headerContent` a nonzero height and keep its dimensions stable while refreshing to avoid resetting the native header position. `onRefreshOffsetChange` receives `{ offset, headerSize, isDragging }` in px, and `onHeaderReleased` receives the last offset and current header size. `onStartRefresh` reports `triggeredBy: 'drag' | 'startRefresh'`. `onRefreshStateChange` forwards the native numeric state; use `isDragging` to track pulling because native refresh does not synthesize the hook implementation's dragging state.

Set `enableRefresh: false` to disable new refreshes without remounting nested content. An active operation can still call `finishRefresh()`. Passing `refreshOptions={false}` or omitting it removes the wrapper.

For independent page refresh, set `refreshInSlot` and put a FeedList with `refreshOptions={{ ...options, mode: 'native' }}` inside each page. Finish each page's refresh through its own FeedList ref. Enabled outer refresh takes precedence when both are requested.

## Navigation and events

Use `scrollTo(offset, animated)`, `scrollToTop(animated)`, `scrollToSticky(animated)`, and `scrollIntoView(headerChildId, animated)`. These control the header only; nested lists retain their own offsets. `scrollIntoView` targets an ID inside `headers`; IDs must be unique on the page. Commands use instance-local refs so multiple coordinators do not share a refresh or scroll target.

`onOffsetChange` receives `{ offset, height }` in px. `main-thread:onOffsetChange` receives the same payload and requires a `'main thread'` callback. Sticky transitions use `granularity` as their tolerance and fire once per transition. Zero-height headers do not enter the sticky state.

Pass raw native properties explicitly through `coordinatorProps`. Component-managed properties take precedence. `popupOptions` applies only to native hosts supporting popup expansion; normal pages do not need it.

The native host must register the public `scroll-coordinator*` and `refresh*` elements. Hosts using legacy registrations can enable the Lynx 4.0+ `syncXElementRegistry` page configuration. Renaming JSX tags alone cannot add missing native implementations.

## Prompt formula

“Build a bounded ScrollCoordinator with [header], [persistent toolbar], and [vertical list or paged content]. Use [outer refresh or per-page refresh], finish every refresh, preserve nested scroll positions, and use LUNA styles with enough safe-area padding.”
