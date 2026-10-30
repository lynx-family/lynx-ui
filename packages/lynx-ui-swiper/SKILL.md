# lynx-ui-swiper SKILL

`Swiper` is a high-performance, fully customizable carousel. It supports horizontal swiping, looping, auto-play, RTL, edge bounces, and both built-in and custom layouts/animations. This guide is written for AI code agents to generate correct, production-ready code with minimal back-and-forth.

## 1. Core Capabilities

- Horizontal swipe with inertial paging and configurable `duration` and easing
- Looping with `loop` and `loopDuplicateCount`
- Auto Play with `autoPlay` and `autoPlayInterval`
- Two layout modes: `mode='normal'` and `mode='custom'`
- Custom per-item animation via `main-thread:customAnimation` (+ `customAnimationFirstScreen` for first screen rendering)
- Edge bounce views with `bounceConfig` and release callbacks
- RTL support via `RTL` (`true` or `'lynx-rtl'`)
- Fine-grained touch-angle control via `consumeSlideEvent`, and event coordination via `blockNativeEvent`
- Imperative control with `SwiperRef` (`swipeNext`, `swipePrev`, `swipeTo`, `cancelAnimation`)
- Container sizing through numeric `containerWidth` in px; explicitly provide the available viewport width for padded or nested layouts

## 2. AI Coding Guide

### Minimal Usable Example

Each `<Swiper>` must provide `data`, `itemWidth`, and render children via a function that returns a `<SwiperItem>`.

Provide `containerWidth` explicitly to match the available width. This example uses a 320px-wide wrapper and 300px-wide items.

```tsx
import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'

const data = ['red', 'green', 'blue']
const CONTAINER_WIDTH = 320

function Example() {
  return (
    <view style={{ width: `${CONTAINER_WIDTH}px` }}>
      <Swiper data={data} itemWidth={300} containerWidth={CONTAINER_WIDTH}>
        {({ item, index }) => (
          <SwiperItem>
            <view
              style={{ width: '100%', height: '200px', backgroundColor: item }}
            >
              <text>Item {index}</text>
            </view>
          </SwiperItem>
        )}
      </Swiper>
    </view>
  )
}
```

### Container Width Contract

- `containerWidth` is the Swiper viewport width in px, while `itemWidth` is the width of each slide. They may differ to show neighboring slides.
- **For a padded, nested, or otherwise narrower layout, you MUST pass `containerWidth` matching the available width inside the parent.** Swiper does not measure its parent. The default is `lynx.__globalProps.screenWidth`, falling back to `SystemInfo.pixelWidth / SystemInfo.pixelRatio`; use that default only when the viewport actually spans the screen width.
- For a parent spanning the screen with 16px padding on each side, pass `containerWidth={screenWidth - 32}`, where `screenWidth` is the actual screen width in px. For a narrower card or column, use that container's available width instead of screen width. If layout determines the width dynamically, measure the containing view and pass the resulting numeric width, updating it when the layout changes.
- CSS width on a wrapper, `flex: 1`, and `style={{ width: '100%' }}` on Swiper do not substitute for `containerWidth`. Swiper writes its root width from this prop after applying `style`, and uses it for alignment and offset calculations. Do not pass CSS strings such as `'100%'` or `'320px'` to `containerWidth`.
- Use the same viewport width for custom animation centering and any `offsetLimit` calculation. The snippets below use a 320px viewport; adapt it to the actual layout.

### Render Props Mechanics

- `<Swiper>` calls your children function once per item with `{ item, index }`.
- You must return a single `<SwiperItem>` as the root of that function; place your content inside it.
- Use `index` for app content such as labels, item lookup, and indicators.

### Recommended Prompt Formula

> Scenario + Layout Mode/Align + Sizes (`itemWidth`, `containerWidth`) + Data + Interaction (loop, auto-play, bounces, RTL) + Callbacks + Optional custom animation

Examples:

- “Create a centered carousel with `spaceBetween=16`, 5 items, `itemWidth=350`, an indicator, and Prev/Next buttons.”
- “Implement looped auto-play Swiper (`autoPlayInterval=2500`), align `start`, and an end bounce for ‘Show More’.”
- “Build a `mode='custom'` Swiper with scale and translateX animation using `main-thread:customAnimation`.”

## 3. Use Cases & Best Practices

- Basic Horizontal: `mode='normal'` with `modeConfig.align` (`start`/`center`/`end`) and optional `spaceBetween`.
- Loop & Auto Play: set `loop={true}` and `autoPlay={true}` with `autoPlayInterval`.
- Bounces: configure `bounceConfig` with `startBounceItem`/`endBounceItem` and widths; release callbacks fire with `{ type, offset }`. Bounces are ignored when `loop=true`.
- Custom Animation: switch to `mode='custom'` and provide `main-thread:customAnimation(value, index) => style`. Duplicate this logic in `customAnimationFirstScreen` for first-screen rendering.
- RTL: set `RTL={true}` or `RTL={'lynx-rtl'}`. The latter applies Lynx’s `direction: lynx-rtl` explicitly.
- In Scroll Containers: when inside `scroll-view` or other vertical scrollers, set `experimentalHorizontalSwipeOnly={true}` and, if native events are being swallowed, set `blockNativeEvent={true}`; tune `consumeSlideEvent` if needed.
- Indicators & Controls: derive `current` from `onChange`, render an external indicator, and use `SwiperRef` to control navigation.
- Container Sizing: follow the Container Width Contract above; use `style={{ overflow: 'visible' }}` if centered items need to bleed.

### Loop + Auto Play Example

```tsx
<Swiper
  data={['red', 'green', 'yellow', 'purple']}
  itemWidth={315}
  itemHeight={220}
  containerWidth={320}
  loop
  autoPlay
  autoPlayInterval={2000}
  mode='normal'
  modeConfig={{ align: 'start', spaceBetween: 8 }}
  experimentalHorizontalSwipeOnly
>
  {({ item, index }) => (
    <SwiperItem>
      <view style={{ width: '100%', height: '100%', backgroundColor: item }} />
      <text>Number.{index}</text>
    </SwiperItem>
  )}
</Swiper>
```

### Bounces Example

Note: `startBounceItemWidth` / `endBounceItemWidth` default to `50`. This example sets `endBounceItemWidth` to `100` to demonstrate a larger overscroll resistance range.

```tsx
<Swiper
  data={colors}
  itemWidth={250}
  itemHeight={200}
  containerWidth={320}
  mode='normal'
  bounceConfig={{
    enable: true,
    endBounceItemWidth: 100,
    endBounceItem: (
      <view style='display: linear; linear-orientation: vertical; height: 100%; width: 30px;'>
        <text>Show More</text>
      </view>
    ),
    onEndBounceItemBounce: ({ type, offset }) => {
      console.log('bounce', type, offset)
    },
  }}
>
  {({ index }) => (
    <SwiperItem>
      {/* content */}
    </SwiperItem>
  )}
</Swiper>
```

### Custom Animation Example (`mode='custom'`)

```tsx
import { interpolate, interpolateJS } from '@lynx-js/lynx-ui'

const ITEM_WIDTH = 250
const CONTAINER_WIDTH = 320

function customAnimation(value: number) {
  'main thread'
  const scale = interpolate(value, [-1, 0, 1], [0.8, 1, 0.8])
  const centerOffset = (CONTAINER_WIDTH - ITEM_WIDTH) / 2
  const translateX = interpolate(value, [-1, 0, 1], [
    -ITEM_WIDTH + centerOffset,
    centerOffset,
    ITEM_WIDTH + centerOffset,
  ], 'extend')
  return {
    transform: `translateX(${translateX}px) scale(${scale})`,
    'transform-origin': 'center',
  }
}

function customAnimationFirstScreen(value: number) {
  const scale = interpolateJS(value, [-1, 0, 1], [0.8, 1, 0.8])
  const centerOffset = (CONTAINER_WIDTH - ITEM_WIDTH) / 2
  const translateX = interpolateJS(value, [-1, 0, 1], [
    -ITEM_WIDTH + centerOffset,
    centerOffset,
    ITEM_WIDTH + centerOffset,
  ], 'extend')
  return {
    transform: `translateX(${translateX}px) scale(${scale})`,
    'transform-origin': 'center',
  }
}

<Swiper
  data={colors}
  itemWidth={ITEM_WIDTH}
  itemHeight={200}
  containerWidth={CONTAINER_WIDTH}
  mode='custom'
  main-thread:customAnimation={customAnimation}
  customAnimationFirstScreen={customAnimationFirstScreen}
>
  {({ index }) => (
    <SwiperItem>
      {/* content */}
    </SwiperItem>
  )}
</Swiper>
```

### RTL Example

```tsx
<Swiper
  data={items}
  itemWidth={300}
  itemHeight={200}
  containerWidth={320}
  mode='normal'
  modeConfig={{ align: 'start', spaceBetween: 8 }}
  RTL={true}
>
  {({ index }) => (
    <SwiperItem>
      {/* content */}
    </SwiperItem>
  )}
</Swiper>
```

## 4. Props Highlights

- `data`: array of items to render; consumed by children render function
- `itemWidth`: per-item width in px; required
- `itemHeight`: optional per-item height; omit for natural/content-driven height
- `containerWidth`: numeric viewport width in px; defaults to screen width, not parent width. Explicitly pass the available width for padded or nested layouts (see Container Width Contract).
- `mode`: `'normal' | 'custom'`; affects item placement
- `modeConfig`: `{ align?: 'start' | 'center' | 'end'; spaceBetween?: number }` for normal mode
- `loop` / `loopDuplicateCount`: enable loop and control cloned head/tail count
- `autoPlay` / `autoPlayInterval`: enable and tune auto paging
- `bounceConfig`: edge views and behavior; ignored when `loop=true`
- `offsetLimit`: limit offset to avoid blank edges, e.g. `[0, containerWidth - itemWidth]`
- `consumeSlideEvent`: angle windows for handling touches; default covers horizontal
- `blockNativeEvent`: when Swiper is inside other scroll containers
- `RTL`: `true` or `'lynx-rtl'`
- `onChange`, `onSwipeStart`, `onSwipeStop`, `main-thread:onOffsetChange`
- `main-thread:easing`, `main-thread:customAnimation`, `customAnimationFirstScreen`

## 5. Ref API

```ts
interface SwiperRef {
  swipeNext(): void
  swipePrev(): void
  swipeTo(
    index: number,
    options?: { animate?: boolean, onFinished?: () => void },
  ): void
  cancelAnimation(): void // use with caution
}
```

## 6. FAQ

- Do children have to be a function? Yes. It receives `{ item, index }` and must return `<SwiperItem>`.
- Why does Swiper overflow its parent or center slides incorrectly? Pass the parent's available viewport width in px through `containerWidth`. The screen-width default does not account for parent padding or narrower containers, and CSS width alone does not update Swiper's geometry. See Container Width Contract.
- Why doesn’t `initialIndex` update after mount? It is only applied at first screen; later updates are ignored. Use `swiperKey` or `resetOnReuse` to reset.
- My last item leaves a blank area when `align='start'`. Provide `offsetLimit={[0, containerWidth - itemWidth]}` to clamp the range.
- Bounces don’t trigger when `loop=true`. Correct—bounce is ignored in looping.
- I’m in a vertical `scroll-view`, swipes feel conflicted. Set `experimentalHorizontalSwipeOnly={true}` and consider `blockNativeEvent={true}`; adjust `consumeSlideEvent` if needed.
- Why duplicate `customAnimationFirstScreen`? It mirrors `main-thread:customAnimation` for first-screen rendering until main-thread first-screen support arrives.
- Opacity rendering glitches? Set `overlap` on `<SwiperItem>`’s direct child as needed.
