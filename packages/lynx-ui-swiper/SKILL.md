# Lynx UI Swiper SKILL

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

## 2. AI Coding Guide

### Minimal Usable Example

Each `<Swiper>` must provide `data`, `itemWidth`, and render children via a function that returns a `<SwiperItem>`. Use `realIndex` for React `key`, especially in loop mode.

```tsx
import { Swiper, SwiperItem } from '@lynx-js/lynx-ui-swiper'

const data = ['red', 'green', 'blue']

function Example() {
  return (
    <Swiper data={data} itemWidth={300}>
      {({ item, index, realIndex }) => (
        <SwiperItem index={index} key={realIndex} realIndex={realIndex}>
          <view
            style={{ width: '100%', height: '200px', backgroundColor: item }}
          >
            <text>Item {index}</text>
          </view>
        </SwiperItem>
      )}
    </Swiper>
  )
}
```

### Render Props Mechanics

- `<Swiper>` calls your children function once per item with `{ item, index, realIndex }`.
- You must return a single `<SwiperItem>` as the root of that function; place your content inside it.
- `index` is the logical index in `data`; `realIndex` is the physical index (differs in loop mode). Use `realIndex` for the React `key`.
- When `loop={false}`, `index === realIndex`.

### Recommended Prompt Formula

> Scenario + Layout Mode/Align + Sizes (`itemWidth`, `containerWidth`) + Data + Interaction (loop, auto-play, bounces, RTL) + Callbacks + Optional custom animation

Examples:

- “Create a centered carousel with `spaceBetween=16`, 5 items, `itemWidth=350`, an indicator, and Prev/Next buttons.”
- “Implement looped auto-play Swiper (`autoPlayInterval=2500`), align `start`, and an end bounce for ‘Show More’.”
- “Build a `mode='custom'` Swiper with scale and translateX animation using `main-thread:customAnimation`.”

## 3. Use Cases & Best Practices

- Basic Horizontal: `mode='normal'` with `modeConfig.align` (`start`/`center`/`end`) and optional `spaceBetween`.
- Loop & Auto Play: set `loop={true}` and `autoPlay={true}` with `autoPlayInterval`. Use `realIndex` as React `key` in children.
- Bounces: configure `bounceConfig` with `startBounceItem`/`endBounceItem` and widths; release callbacks fire with `{ type, offset }`. Bounces are ignored when `loop=true`.
- Custom Animation: switch to `mode='custom'` and provide `main-thread:customAnimation(value, index) => style`. Duplicate this logic in `customAnimationFirstScreen` for first-screen rendering.
- RTL: set `RTL={true}` or `RTL={'lynx-rtl'}`. The latter applies Lynx’s `direction: lynx-rtl` explicitly.
- In Scroll Containers: when inside `scroll-view` or other vertical scrollers, set `experimentalHorizontalSwipeOnly={true}` and, if native events are being swallowed, set `blockNativeEvent={true}`; tune `consumeSlideEvent` if needed.
- Indicators & Controls: derive `current` from `onChange`, render an external indicator, and use `SwiperRef` to control navigation.
- Container Sizing: set `containerWidth` explicitly (screen width minus paddings) to avoid mis-measure; use `style={{ overflow: 'visible' }}` if centered items need to bleed.

### Loop + Auto Play Example

```tsx
<Swiper
  data={['red', 'green', 'yellow', 'purple']}
  itemWidth={315}
  itemHeight={220}
  containerWidth={(lynx.__globalProps.screenWidth || 375) - 16}
  loop
  autoPlay
  autoPlayInterval={2000}
  mode='normal'
  modeConfig={{ align: 'start', spaceBetween: 8 }}
  experimentalHorizontalSwipeOnly
>
  {({ item, index, realIndex }) => (
    <SwiperItem index={index} key={realIndex} realIndex={realIndex}>
      <view style={{ width: '100%', height: '100%', backgroundColor: item }} />
      <text>Number.{index}</text>
    </SwiperItem>
  )}
</Swiper>
```

### Bounces Example

```tsx
<Swiper
  data={colors}
  itemWidth={250}
  itemHeight={200}
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
  {({ index, realIndex }) => (
    <SwiperItem index={index} key={realIndex} realIndex={realIndex}>
      {/* content */}
    </SwiperItem>
  )}
</Swiper>
```

### Custom Animation Example (`mode='custom'`)

```tsx
import { interpolate, interpolateJS } from '@lynx-js/lynx-ui-common'

const ITEM_WIDTH = 250

function customAnimation(value: number) {
  'main thread'
  const scale = interpolate(value, [-1, 0, 1], [0.8, 1, 0.8])
  const centerOffset = (lynx.__globalProps.screenWidth - ITEM_WIDTH) / 2
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
  const centerOffset = (lynx.__globalProps.screenWidth - ITEM_WIDTH) / 2
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
  mode='custom'
  main-thread:customAnimation={customAnimation}
  customAnimationFirstScreen={customAnimationFirstScreen}
>
  {({ index, realIndex }) => (
    <SwiperItem index={index} key={realIndex} realIndex={realIndex}>
      {/* content */}
    </SwiperItem>
  )}
</Swiper>
```

### RTL Example

```tsx
<Swiper
  data={items}
  itemWidth={350}
  itemHeight={200}
  mode='normal'
  modeConfig={{ align: 'start', spaceBetween: 8 }}
  RTL={true}
>
  {({ index, realIndex }) => (
    <SwiperItem index={index} key={realIndex} realIndex={realIndex}>
      {/* content */}
    </SwiperItem>
  )}
</Swiper>
```

## 4. Props Highlights

- `data`: array of items to render; consumed by children render function
- `itemWidth`: per-item width in px; required
- `itemHeight`: optional per-item height; omit for natural/content-driven height
- `containerWidth`: Swiper container width; default to `lynx.__globalProps.screenWidth`
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

- Do children have to be a function? Yes. It receives `{ item, index, realIndex }` and must return `<SwiperItem>`.
- Why both `index` and `realIndex`? In loop mode, clones shift indices; use `realIndex` for React `key`.
- Why doesn’t `initialIndex` update after mount? It is only applied at first screen; later updates are ignored. Use `swiperKey` or `resetOnReuse` to reset.
- My last item leaves a blank area when `align='start'`. Provide `offsetLimit={[0, containerWidth - itemWidth]}` to clamp the range.
- Bounces don’t trigger when `loop=true`. Correct—bounce is ignored in looping.
- I’m in a vertical `scroll-view`, swipes feel conflicted. Set `experimentalHorizontalSwipeOnly={true}` and consider `blockNativeEvent={true}`; adjust `consumeSlideEvent` if needed.
- Why duplicate `customAnimationFirstScreen`? It mirrors `main-thread:customAnimation` for first-screen rendering until main-thread first-screen support arrives.
- Opacity rendering glitches? Set `overlap` on `<SwiperItem>`’s direct child as needed.
