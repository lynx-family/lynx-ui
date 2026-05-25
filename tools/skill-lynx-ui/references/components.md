# Components

Read this file when the task is primarily about a Lynx UI component, component composition, or choosing the closest official component example.

## Official component index

- Components index: `https://lynxjs.org/next/lynx-ui/`
- Introduction: `https://lynxjs.org/next/lynx-ui/introduction`

## How to use this file

- Start with the closest component section below.
- If you are not sure which component family applies, use the quick routing guide in this file first.
- Use this file to choose the component family, then route into the generated `references/components/<component>/` directory for repo-local detail.
- Open the official component URL linked in that section.
- Keep the official structure and subcomponent shape intact.
- Adapt only naming, surrounding layout, local data wiring, and app-specific wrappers.
- After selecting a component family here, prefer the generated files under `references/components/<component>/` in this order:
  - `guide.md` for usage patterns and composition guidance
  - `api.md` for exact public props, ref methods, and exports
  - `examples.md` for repo-grounded implementation patterns

## Component code style rules

- Prefer the official Lynx UI component composition instead of inventing generic wrappers.
- Keep controlled vs uncontrolled usage consistent with the docs.
- Keep state styling aligned with official state classes or render props.
- If a component uses main-thread callbacks or gesture-specific props, keep that architecture intact.
- If the user asks for a new flow, start from one component section here and compose outward.
- If the user needs a multi-part screen, start from the relevant component section here, then combine it with the guidance in `screen-recipes.md` and the generated `references/components/<component>/` files.
- If the user needs exact repo-grounded API verification, use the generated component references as the source of truth.

## Table of contents

- [Button](#button)
- [Checkbox](#checkbox)
- [Dialog](#dialog)
- [Draggable](#draggable)
- [FeedList](#feedlist)
- [Form](#form)
- [Input and TextArea](#input-and-textarea)
- [LazyComponent](#lazycomponent)
- [List](#list)
- [OverlayView](#overlayview)
- [Popover](#popover)
- [RadioGroup](#radiogroup)
- [ScrollView](#scrollview)
- [Sheet](#sheet)
- [Sortable](#sortable)
- [SwipeAction](#swipeaction)
- [Swiper](#swiper)
- [Switch](#switch)

## Freshness note

This file is a maintained local field guide, not the final authority. Use it to pick the right component family, then confirm repo-local usage against the generated `references/components/<component>/` files. If a component is missing here or the local snippet looks stale, check the official Lynx UI website first and treat the website as the source of truth.

## Quick routing guide

- Need a pressable action or submit control? Start with [Button](#button).
- Need a boolean toggle or partial selection? Start with [Checkbox](#checkbox) or [Switch](#switch).
- Need a form field or keyboard-aware text entry? Start with [Input and TextArea](#input-and-textarea) or [Form](#form).
- Need a modal, drawer, floating layer, or anchored popup? Start with [Dialog](#dialog), [Sheet](#sheet), [OverlayView](#overlayview), or [Popover](#popover).
- Need a long list, feed, swipeable row, or carousel? Start with [List](#list), [FeedList](#feedlist), [SwipeAction](#swipeaction), or [Swiper](#swiper).
- Need drag, direct manipulation, or reordering? Start with [Draggable](#draggable) or [Sortable](#sortable).
- Need deferred rendering or scrollable content wrappers? Start with [LazyComponent](#lazycomponent) or [ScrollView](#scrollview).
- Need exact repo-local component surface details? Use `reference.md` and generated `references/components/<component>/` after choosing the family here.

## Button

Official docs: `https://lynxjs.org/next/lynx-ui/components/button.html`

**Use when**
- the user needs a pressable action
- the UI needs active/disabled state styling
- the user wants a headless button primitive instead of a generic view click handler

**Official structure**

```tsx
<Button disabled={false} onClick={fn}>
  {({ active, disabled }) => <view>...</view>}
</Button>
```

**Key props and states**
- `disabled`
- `onClick`
- render-prop children with `{ active, disabled }`
- state classes such as `ui-active` and `ui-disabled`

**Adaptation notes**
- Keep the `Button` primitive.
- Lynx UI `Button` uses `onClick`, not raw native view event props like `bindtap` or `catchtap`.
- Use `bindtap`/`catchtap` only on raw Lynx elements such as `view` when the task is explicitly about native event wiring rather than a Lynx UI component.
- Change only the internal content, layout wrappers, and local click behavior.
- Use the active/disabled state channels instead of inventing separate state wiring.

## Checkbox

Official docs: `https://lynxjs.org/next/lynx-ui/components/checkbox.html`

**Use when**
- the user needs boolean selection
- the UI needs controlled or uncontrolled checkbox state
- the user needs an indeterminate state for partial selection

**Official structure**

```tsx
<Checkbox className="checkbox">
  <CheckboxIndicator className="checkbox-indicator">
    {<YourOwnCheckIcon />}
  </CheckboxIndicator>
</Checkbox>
```

**Key props and states**
- `checked`
- `defaultChecked`
- `indeterminate`
- `disabled`
- `onChange`
- state classes: `ui-checked`, `ui-indeterminate`, `ui-active`, `ui-disabled`
- render-prop state access: `{ checked, indeterminate, active, disabled }`

**Adaptation notes**
- Keep `Checkbox` and `CheckboxIndicator` together.
- Preserve controlled vs uncontrolled semantics.
- Use official state classes or render props for styling before introducing custom state plumbing.

## Dialog

Official docs: `https://lynxjs.org/next/lynx-ui/components/dialog.html`

**Use when**
- the user needs a modal overlay or dismissible dialog
- the flow needs a backdrop and content layering
- the task involves controlled open/close state

**Official structure**

```tsx
<DialogRoot show={open} onShowChange={setOpen}>
  <DialogView>
    <DialogBackdrop clickToClose />
    <DialogContent>Content here</DialogContent>
  </DialogView>
</DialogRoot>
```

**Key props and states**
- `show` / `defaultShow`
- `onShowChange`
- `clickToClose` on `DialogBackdrop`
- `container` on `DialogView`
- `forceMount`
- state channels: `ui-open`, `ui-closed`, `ui-entering`, `ui-leaving`, `ui-animating`

**Adaptation notes**
- Keep the root/view/backdrop/content layering.
- Let the component control open-state flow instead of hand-rolling a custom modal stack.
- Reuse official state classes for transition styling.

## Draggable

Official docs: `https://lynxjs.org/next/lynx-ui/components/draggable.html`

**Use when**
- the user needs drag-and-drop or direct manipulation
- the interaction must be smooth and gesture-aware
- the flow needs bounded dragging or main-thread callbacks

**Official structure**

```tsx
<Draggable
  trigger="longpress"
  maxTranslateX={200}
  maxTranslateY={200}
  onDragEnd={(translate) => console.log(translate)}
>
  <view className="drag-handle">Drag me</view>
</Draggable>
```

Alternative structure:

```tsx
<DraggableRoot>
  <DraggableArea />
</DraggableRoot>
```

**Key props and states**
- `trigger`: `longpress` or `immediate`
- `allowedDirection`: `all`, `x`, or `y`
- `resetOnEnd`
- `minTranslateX`, `maxTranslateX`, `minTranslateY`, `maxTranslateY`
- `enableDragging`
- `onDragStart`, `onDragging`, `onDragEnd`
- `onMTSDragStart`, `onMTSDragging`, `onMTSDragEnd`

**Adaptation notes**
- Preserve the main-thread callback path when latency matters.
- Keep bounds and gesture-start rules in component props instead of moving them to generic gesture code.
- Use `DraggableArea` when only part of the UI should start the drag.

## FeedList

Official docs: `https://lynxjs.org/next/lynx-ui/components/feed-list.html`

**Use when**
- the user needs a feed-style virtualized list
- the UI needs pull-to-refresh or built-in infinite loading
- the list should expose explicit has-more and refresh controls

**Official structure**

```tsx
<FeedList
  listId="feed"
  listType="flow"
  refreshOptions={true}
  loadMoreFooter={<Loading />}
  noMoreDataFooter={<Text>No more</Text>}
  onScrollToLower={loadMore}
>
  {items.map(item => (
    <list-item key={item.id} item-key={item.id}>
      <Card data={item} />
    </list-item>
  ))}
</FeedList>
```

**Key props and methods**
- `listId`
- `listType`
- `refreshOptions`
- `loadMoreFooter`
- `noMoreDataFooter`
- `onScrollToLower`
- ref methods such as `startRefresh()`, `finishRefresh()`, `changeHasMoreStatus(hasMore)`

**Adaptation notes**
- Keep feed items as documented list children.
- Put refresh and load-more behavior on the official props instead of custom side channels.
- Use `FeedList` when the task is more feed-oriented than a generic `List`.

## Form

Official docs: `https://lynxjs.org/next/lynx-ui/components/form.html`

**Use when**
- the user needs form context and submission wiring
- the UI combines multiple field primitives under one submit flow
- the task needs Lynx UI field components collected into a single payload

**Official structure**

```tsx
<FormRoot initialValues={{}}>
  <FormField as="Input" name="email" type="email" placeholder="Enter email" />
  <FormSubmitButton onSubmit={handleSubmit} />
</FormRoot>
```

**Key APIs**
- `FormRoot`
- `FormField`
- `FormSubmitButton`
- `initialValues`
- `onChanged`
- `onSubmit`
- field-level props carried through `as`

**Adaptation notes**
- Use `FormField as=...` with documented field primitives instead of inventing a parallel form wrapper.
- Keep submission on `FormSubmitButton` or root submission callbacks.
- Reuse Lynx UI field components so state collection stays aligned with the docs.

## Input and TextArea

Official docs: `https://lynxjs.org/next/lynx-ui/components/input.html`

**Use when**
- the user needs single-line or multi-line text entry
- the flow depends on keyboard-aware layout behavior
- the input needs confirm actions or mobile text-entry tuning

**Official structure**

```tsx
<Input
  style={{ width: '100%', padding: '10px' }}
  placeholder="Enter text"
  onInput={(v) => console.log(v)}
/>
```

Keyboard-aware composition pattern:

```tsx
<KeyboardAwareRoot>
  <KeyboardAwareResponder>
    <KeyboardAwareTrigger>
      <Input />
    </KeyboardAwareTrigger>
  </KeyboardAwareResponder>
</KeyboardAwareRoot>
```

**Key props and states**
- `value` / `defaultValue`
- `type`
- `confirmType`
- `maxLength`
- `onInput`
- `onConfirm`
- `showSoftInputOnFocus`
- keyboard-aware wrapper props such as `offset`

**Adaptation notes**
- Use `Input` for single-line text and `TextArea` for multi-line text.
- Keep keyboard-aware wrappers when the layout must respond to the soft keyboard.
- Preserve controlled vs uncontrolled behavior from the docs.

## List

Official docs: `https://lynxjs.org/next/lynx-ui/components/list.html`

**Use when**
- the user needs a virtualized list
- the flow renders long data sets or infinite loading
- the UI needs list snapping, scroll observation, or performance tuning

**Official structure**

```tsx
<List
  listType="flow"
  initialScrollIndex={0}
  onScrollToLower={() => loadMore()}
  preloadBufferCount={2}
>
  {items.map(item => <ListItem key={item.id} />)}
</List>
```

**Key props and methods**
- `listType`
- `initialScrollIndex`
- `scrollTo`
- `scrollIntoID`
- `onScroll`
- `onScrollToLower`
- `onScrollStateChange`
- `preloadBufferCount`
- `itemSnap`
- ref methods such as `scrollTo`, `scrollIntoID`, `autoScroll`, `getVisibleCells`

**Adaptation notes**
- Keep `List` as the virtualization container instead of replacing it with repeated plain views.
- Put load-more and scroll behavior on the documented list events.
- Use the documented layout mode before inventing custom list layout behavior.

## LazyComponent

Official docs: `https://lynxjs.org/next/lynx-ui/components/lazy-component.html`

**Use when**
- the user needs to defer non-critical UI until it becomes visible
- the task is about first-screen performance or scroll-heavy content
- the UI has expensive content that should not render immediately

**Official structure**

```tsx
<LazyComponent estimatedStyle={{ height: 200 }}>
  <HeavyContent />
</LazyComponent>
```

**Key props and states**
- `estimatedStyle`
- `top`, `bottom`, `left`, `right`
- `unloadable`
- `unmountOnExit`
- `pid`
- `scene`

**Adaptation notes**
- Always provide the estimated size the docs expect.
- Use margin props to tune earlier/later rendering instead of inventing custom exposure logic.
- Keep `LazyComponent` for deferred rendering rather than replacing it with ad hoc viewport checks.

## OverlayView

Official docs: `https://lynxjs.org/next/lynx-ui/components/overlay.html`

**Use when**
- the user needs content rendered above the normal view tree
- the UI needs a native overlay layer
- the task is about replacing raw overlay setup with a Lynx UI wrapper

**Official structure**

```tsx
<OverlayView container="default">
  <view className="panel">
    <text>Overlay content</text>
  </view>
</OverlayView>
```

**Key props and states**
- `container`
- `overlayLevel`
- `overlayViewProps`

**Adaptation notes**
- Use `OverlayView` as the drop-in overlay primitive.
- Keep overlay configuration in the official props before creating custom overlay plumbing.
- If full-screen overlay behavior matters, start with the `container="default"` pattern from the docs.

## Popover

Official docs: `https://lynxjs.org/next/lynx-ui/components/popover.html`

**Use when**
- the user needs anchored floating content
- the UI needs a trigger, content, and arrow tied to placement rules
- the flow needs controlled visibility or transition states

**Official structure**

```tsx
<PopoverRoot>
  <PopoverTrigger />
  <PopoverAnchor>
    <PopoverPositioner>
      <PopoverContent />
      <PopoverArrow />
    </PopoverPositioner>
  </PopoverAnchor>
</PopoverRoot>
```

**Key props and states**
- `placement`
- `crossAxisOffset`
- `autoAdjust`
- `transition`
- `forceMount`
- `show` / `defaultShow`
- state channels: `open`, `closed`, `entering`, `leaving`, `animating`

**Adaptation notes**
- Preserve the trigger/anchor/positioner/content structure.
- Keep placement logic in component props rather than replacing it with ad hoc positioning code.
- Reuse official transition state classes if the popover animates.

## RadioGroup

Official docs: `https://lynxjs.org/next/lynx-ui/components/radio-group.html`

**Use when**
- the user needs single selection from a set of mutually exclusive options
- the UI needs radio-style state managed at a group level
- the task needs controlled or uncontrolled radio selection

**Official structure**

```tsx
<RadioGroupRoot value={sel} onValueChange={setSel}>
  <Radio value="a"><RadioIndicator /></Radio>
  <Radio value="b"><RadioIndicator /></Radio>
</RadioGroupRoot>
```

**Key props and states**
- `value` / `defaultValue`
- `onValueChange`
- `disabled` on root or item
- `RadioIndicator`
- `forceMount` on the indicator when needed

**Adaptation notes**
- Keep selection state at the group level.
- Use `RadioIndicator` rather than custom selected markers when possible.
- Preserve controlled vs uncontrolled selection semantics from the docs.

## ScrollView

Official docs: `https://lynxjs.org/next/lynx-ui/components/scroll-view.html`

**Use when**
- the user needs a scrollable container rather than a virtualized list
- the UI needs bounce behavior or lazy viewport rendering
- the task is about scroll regions with custom content inside

**Official structure**

```tsx
<ScrollView
  bounceable
  bounceableOptions={{
    enableBounces: true,
    singleSidedBounce: 'both',
    upperBounceItem: <RefreshIndicator />,
  }}
  lazy
>
  {items}
</ScrollView>
```

**Key props and states**
- `bounceable`
- `bounceableOptions`
- `lazy`
- `lazyOptions`
- `horizontal` / `scrollOrientation`
- `upperBounceItem`, `lowerBounceItem`
- `onScrollToBounces`

**Adaptation notes**
- Use `ScrollView` for scrollable arbitrary content, not long virtualized feeds.
- Keep bounce and lazy behavior in the documented props.
- If the task is really data virtualization, consider `List` or `FeedList` first.

## Sheet

Official docs: `https://lynxjs.org/next/lynx-ui/components/sheet.html`

**Use when**
- the user needs a bottom sheet, top sheet, or side drawer
- the UI needs snap points or drag-enabled panel behavior
- the task is about directional sliding surfaces

**Official structure**

```tsx
<SheetRoot defaultShow snapPoints={['fit', '50%', 300]}>
  <SheetView>
    <SheetBackdrop />
    <SheetContent>
      <SheetHandle />
      <view>Content</view>
    </SheetContent>
  </SheetView>
</SheetRoot>
```

**Key props and states**
- `side`
- `snapPoints`
- `show` / `onShowChange`
- root ref methods such as `open`, `close`, `snapTo`
- `SheetBackdrop`, `SheetContent`, `SheetHandle`

**Adaptation notes**
- Keep the root/view/backdrop/content layering.
- Use snap points and side selection from the official API instead of hand-rolling drag panels.
- Reach for `Sheet` instead of `Dialog` when the surface should slide and snap.

## Sortable

Official docs: `https://lynxjs.org/next/lynx-ui/components/sortable.html`

**Use when**
- the user needs sortable list reordering
- the flow combines drag interaction with data reordering
- the task needs a documented sortable primitive instead of custom reorder logic

**Official structure**

```tsx
<SortableRoot data={items} onSortEnd={setItems}>
  {(item) => (
    <SortableItem>
      <text>{item.dataItem}</text>
    </SortableItem>
  )}
</SortableRoot>
```

**Key props and states**
- `data`
- `boundaryId`
- `enableSorting`
- `onSortEnd`
- `as` on `SortableItem`

**Adaptation notes**
- Keep sorting state tied to the data array the component expects.
- Use the official sortable item structure instead of layering custom drag/reorder abstractions first.
- Reach for `Sortable` when reordering is the main task, not plain `Draggable`.

## SwipeAction

Official docs: `https://lynxjs.org/next/lynx-ui/components/swipe-action.html`

**Use when**
- the user needs swipeable row actions
- the UI exposes secondary actions without always showing them
- the flow depends on gesture-driven reveal behavior

**Official structure**

```tsx
<SwipeAction
  displayArea={<Text>Swipe me</Text>}
  actionArea={<Button onClick={handleDelete}>Delete</Button>}
  onAction={(id) => console.log('action', id)}
/>
```

**Key props and requirements**
- `displayArea`
- `actionArea`
- `enableSwipe`
- `onAction`
- `onSwipeStart`
- `onSwipeEnd`
- ref methods such as `showActionArea(animated)` and `closeActionArea(animated)`
- requires `enableNewGesture: true` in the ReactLynx plugin config

**Adaptation notes**
- Keep the two-area structure.
- Put destructive or secondary row actions in `actionArea` instead of custom hidden panels.
- If gesture setup fails, check plugin config before changing component design.

## Swiper

Official docs: `https://lynxjs.org/next/lynx-ui/components/swiper.html`

**Use when**
- the user needs a carousel or paged swipe interaction
- the UI depends on slide-level navigation or autoplay
- the task needs item-based swipe transitions with pagination behavior

**Official structure**

```tsx
<Swiper
  data={items}
  itemWidth={300}
  containerWidth={screenWidth}
  onChange={(i) => setIndex(i)}
>
  {({ item }) => <SwiperItem>{item.content}</SwiperItem>}
</Swiper>
```

**Key props and states**
- `data`
- `itemWidth`
- `containerWidth`
- `loop`
- `autoPlay`
- `duration`
- `initialIndex`
- `onChange`
- `customAnimation`
- `mode`
- ref methods such as `swipeTo`, `swipeNext`, `swipePrev`

**Adaptation notes**
- Keep the documented `data` plus render-function shape.
- Use `SwiperItem` rather than inventing a generic carousel wrapper.
- Keep custom animation and navigation in the official swiper API.

## Switch

Official docs: `https://lynxjs.org/next/lynx-ui/components/switch.html`

**Use when**
- the user needs a toggle primitive
- the UI needs checked, active, or disabled state styling
- the task is about binary settings or on/off controls

**Official structure**

```tsx
<Switch checked={on} onChange={setOn}>
  <SwitchThumb />
</Switch>
```

Alternative structure:

```tsx
<Switch>
  <SwitchTrack />
  <SwitchThumb />
</Switch>
```

**Key props and states**
- `checked` / `onChange`
- `defaultChecked`
- `disabled`
- render-prop children with `{ checked, active, disabled }`
- state classes such as `ui-checked`, `ui-active`, `ui-disabled`

**Adaptation notes**
- Keep the Lynx UI switch primitives instead of a generic pressable toggle.
- Preserve controlled vs uncontrolled toggle semantics.
- Style from official state channels before creating parallel state logic.
