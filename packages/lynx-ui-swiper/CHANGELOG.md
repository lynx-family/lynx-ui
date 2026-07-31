# @lynx-js/lynx-ui-swiper

## 3.135.4

### Patch Changes

- Upgrade the Lynx and Rsbuild toolchain dependencies used to build lynx-ui packages. ([#233](https://github.com/lynx-family/lynx-ui/pull/233))

- Updated dependencies [[`753556b`](https://github.com/lynx-family/lynx-ui/commit/753556bc1acb77e05567aba3b8b5ab057b9f670b)]:
  - @lynx-js/lynx-ui-common@3.135.4

## 3.135.3

### Patch Changes

- Update `@lynx-js/react-use` to 0.2.2. ([#228](https://github.com/lynx-family/lynx-ui/pull/228))

- Prevent a looped swiper from exposing blank space or settling outside the rendered items after a long drag. ([#230](https://github.com/lynx-family/lynx-ui/pull/230))

- Updated dependencies [[`44c1de6`](https://github.com/lynx-family/lynx-ui/commit/44c1de68cf47e03c5136431a9efea7cbee69e752)]:
  - @lynx-js/lynx-ui-common@3.135.3

## 3.135.1

### Patch Changes

- Keep custom-mode swiper navigation from being locked when item content does not fill the container. ([#223](https://github.com/lynx-family/lynx-ui/pull/223))

## 3.133.1

### Patch Changes

- Improve Web and desktop touch compatibility by routing `onTouchStart`, ([#200](https://github.com/lynx-family/lynx-ui/pull/200))
  `onTouchMove`, `onTouchEnd`, and `onTouchCancel` through shared touch
  emulation.
- Updated dependencies [[`3932070`](https://github.com/lynx-family/lynx-ui/commit/393207073522e221a79e65c643df2afb329ec931)]:
  - @lynx-js/lynx-ui-common@3.133.1

## 3.133.0

### Patch Changes

- Updated dependencies [[`85d2e9d`](https://github.com/lynx-family/lynx-ui/commit/85d2e9d12e9aeee3256856f1be0076524ddb7d8a)]:
  - @lynx-js/lynx-ui-common@3.133.0

## 3.132.0

### Minor Changes

- Allow SwiperItem to receive item metadata from Swiper context. In normal usage, users can now write `<SwiperItem>` directly without passing `index`, `realIndex`, or `key={realIndex}`. ([#152](https://github.com/lynx-family/lynx-ui/pull/152))

  ```diff
   {({ index, realIndex }) => (
  -  <SwiperItem index={index} realIndex={realIndex} key={realIndex}>
  +  <SwiperItem>
       {content}
     </SwiperItem>
   )}
  ```

## 3.131.0

### Patch Changes

- Preserve two recent touch samples when measuring swipe velocity so Android devices with sparse touch move events still page correctly. ([#122](https://github.com/lynx-family/lynx-ui/pull/122))

- Updated dependencies [[`bc167c5`](https://github.com/lynx-family/lynx-ui/commit/bc167c5d03cdb344156e897c4d2d69f95bf7d29b)]:
  - @lynx-js/lynx-ui-common@3.131.0

## 3.130.0

### Patch Changes

- optimize: fix type errors ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Update files field in all packages to include LICENSE file. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Fix swiper offset limiting when `spaceBetween` is set so swipe is fully disabled when total content width does not exceed the container width. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Fix an issue where swiper would report `Error: calcBounceOffset: invalid offset` when initialize with empty `data` ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Updated dependencies [[`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520)]:
  - @lynx-js/lynx-ui-common@3.130.0
