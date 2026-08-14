# @lynx-js/lynx-ui-sheet

## 3.136.0

### Patch Changes

- Exclude test modules from compiled package output. ([#255](https://github.com/lynx-family/lynx-ui/pull/255))

- Updated dependencies [[`0257f8b`](https://github.com/lynx-family/lynx-ui/commit/0257f8bc9fbe6b8a51df00663c7860827ce468b2)]:
  - @lynx-js/lynx-ui-common@3.136.0
  - @lynx-js/lynx-ui-dialog@3.136.0
  - @lynx-js/lynx-ui-overlay@3.136.0
  - @lynx-js/lynx-ui-presence@3.136.0

## 3.135.4

### Patch Changes

- Upgrade the Lynx and Rsbuild toolchain dependencies used to build lynx-ui packages. ([#233](https://github.com/lynx-family/lynx-ui/pull/233))

- Updated dependencies [[`753556b`](https://github.com/lynx-family/lynx-ui/commit/753556bc1acb77e05567aba3b8b5ab057b9f670b), [`753556b`](https://github.com/lynx-family/lynx-ui/commit/753556bc1acb77e05567aba3b8b5ab057b9f670b)]:
  - @lynx-js/lynx-ui-common@3.135.4
  - @lynx-js/lynx-ui-dialog@3.135.4
  - @lynx-js/lynx-ui-overlay@3.135.4
  - @lynx-js/lynx-ui-presence@3.135.4

## 3.135.3

### Patch Changes

- Updated dependencies [[`44c1de6`](https://github.com/lynx-family/lynx-ui/commit/44c1de68cf47e03c5136431a9efea7cbee69e752)]:
  - @lynx-js/lynx-ui-common@3.135.3
  - @lynx-js/lynx-ui-dialog@3.135.3
  - @lynx-js/lynx-ui-overlay@3.135.3
  - @lynx-js/lynx-ui-presence@3.135.3

## 3.134.0

### Patch Changes

- Updated dependencies [[`92ae41f`](https://github.com/lynx-family/lynx-ui/commit/92ae41f375edc015087c352211a82f582ac1d010)]:
  - @lynx-js/lynx-ui-dialog@3.134.0
  - @lynx-js/lynx-ui-presence@3.134.0

## 3.133.1

### Patch Changes

- Fix side drawer positioning with oversized SheetContent surfaces, make `enableRTL` set the Sheet viewport direction, fix mixed `fit` snap point sizing on the main thread, and fix `SheetHandle` drag touch handling. ([#196](https://github.com/lynx-family/lynx-ui/pull/196))

- Use the highest resolved sheet snap point as the stable inner layout size. Pure `'fit'` snap point sheets continue to preserve content-driven sizing. ([#196](https://github.com/lynx-family/lynx-ui/pull/196))

- Updated dependencies [[`3932070`](https://github.com/lynx-family/lynx-ui/commit/393207073522e221a79e65c643df2afb329ec931)]:
  - @lynx-js/lynx-ui-common@3.133.1
  - @lynx-js/lynx-ui-dialog@3.133.1
  - @lynx-js/lynx-ui-overlay@3.133.1
  - @lynx-js/lynx-ui-presence@3.133.1

## 3.133.0

### Patch Changes

- Allow `SheetHandle` to render children so consumers can make custom handle visuals the drag target. ([#175](https://github.com/lynx-family/lynx-ui/pull/175))

- Updated dependencies [[`85d2e9d`](https://github.com/lynx-family/lynx-ui/commit/85d2e9d12e9aeee3256856f1be0076524ddb7d8a)]:
  - @lynx-js/lynx-ui-common@3.133.0
  - @lynx-js/lynx-ui-dialog@3.133.0
  - @lynx-js/lynx-ui-overlay@3.133.0
  - @lynx-js/lynx-ui-presence@3.133.0

## 3.131.0

### Minor Changes

- Add `Sheet` side support with `top`, physical `left` / `right`, logical `start` / `end`, width-based drawer snap points, `enableRTL` logical-side resolution, and directional examples. ([#112](https://github.com/lynx-family/lynx-ui/pull/112))

- Default `Sheet` snap points to `['fit']` so sheets fit measured content when `snapPoints` is omitted. ([#131](https://github.com/lynx-family/lynx-ui/pull/131))

### Patch Changes

- Updated dependencies [[`bc167c5`](https://github.com/lynx-family/lynx-ui/commit/bc167c5d03cdb344156e897c4d2d69f95bf7d29b)]:
  - @lynx-js/lynx-ui-common@3.131.0
  - @lynx-js/lynx-ui-dialog@3.131.0
  - @lynx-js/lynx-ui-overlay@3.131.0
  - @lynx-js/lynx-ui-presence@3.131.0

## 3.130.1

### Patch Changes

- Update `@lynx-js/motion` to 0.0.3. ([#106](https://github.com/lynx-family/lynx-ui/pull/106))

## 3.130.0

### Minor Changes

- Add <Sheet> component ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

### Patch Changes

- Fix SheetBackdrop `clickToClose` by disabling event-through. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Rename `SheetContent` inner layer props and remove non-headless default styles. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Updated dependencies [[`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520)]:
  - @lynx-js/lynx-ui-common@3.130.0
  - @lynx-js/lynx-ui-presence@3.130.0
  - @lynx-js/lynx-ui-overlay@3.130.0
  - @lynx-js/lynx-ui-dialog@3.130.0
