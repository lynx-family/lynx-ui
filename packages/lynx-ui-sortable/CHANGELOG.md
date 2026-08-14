# @lynx-js/lynx-ui-sortable

## 3.136.0

### Patch Changes

- Updated dependencies [[`0257f8b`](https://github.com/lynx-family/lynx-ui/commit/0257f8bc9fbe6b8a51df00663c7860827ce468b2)]:
  - @lynx-js/lynx-ui-common@3.136.0
  - @lynx-js/lynx-ui-draggable@3.136.0

## 3.135.4

### Patch Changes

- Upgrade the Lynx and Rsbuild toolchain dependencies used to build lynx-ui packages. ([#233](https://github.com/lynx-family/lynx-ui/pull/233))

- Updated dependencies [[`753556b`](https://github.com/lynx-family/lynx-ui/commit/753556bc1acb77e05567aba3b8b5ab057b9f670b)]:
  - @lynx-js/lynx-ui-common@3.135.4
  - @lynx-js/lynx-ui-draggable@3.135.4

## 3.135.3

### Patch Changes

- Updated dependencies [[`44c1de6`](https://github.com/lynx-family/lynx-ui/commit/44c1de68cf47e03c5136431a9efea7cbee69e752)]:
  - @lynx-js/lynx-ui-common@3.135.3
  - @lynx-js/lynx-ui-draggable@3.135.3

## 3.135.0

### Minor Changes

- feat(sortable): support `disabled` items that always keep their absolute position ([#220](https://github.com/lynx-family/lynx-ui/pull/220))

  `SortableItem` now accepts a `disabled` prop. Disabled items cannot be dragged
  themselves and are never displaced by other items' dragging — they always keep
  their absolute position in the final sorted order. Other items can still
  freely cross over them, and only the relative order of non-disabled items can
  change.

  The cross-over translate compensation is scoped to the disabled gap strictly
  between the swap target and its previous movable neighbor, so consecutive
  swaps across alternating locked / unlocked items land each item at the
  expected slot without over-shooting.

### Patch Changes

- fix: delay rect refresh to avoid layout jank ([#216](https://github.com/lynx-family/lynx-ui/pull/216))

## 3.134.0

### Minor Changes

- Support dragging items inside a scrollable boundary, with auto-scroll and a sticky drag overlay. `SortableRoot` now supports `as?: 'ScrollView'` to enable setting the scrollView as the scrollable boundary. ([#211](https://github.com/lynx-family/lynx-ui/pull/211))

## 3.133.1

### Patch Changes

- Improve Web and desktop touch compatibility by routing `onTouchStart`, ([#200](https://github.com/lynx-family/lynx-ui/pull/200))
  `onTouchMove`, `onTouchEnd`, and `onTouchCancel` through shared touch
  emulation.
- Updated dependencies [[`3932070`](https://github.com/lynx-family/lynx-ui/commit/393207073522e221a79e65c643df2afb329ec931)]:
  - @lynx-js/lynx-ui-common@3.133.1
  - @lynx-js/lynx-ui-draggable@3.133.1

## 3.133.0

### Patch Changes

- Updated dependencies [[`85d2e9d`](https://github.com/lynx-family/lynx-ui/commit/85d2e9d12e9aeee3256856f1be0076524ddb7d8a)]:
  - @lynx-js/lynx-ui-common@3.133.0
  - @lynx-js/lynx-ui-draggable@3.133.0

## 3.131.1

### Patch Changes

- Improve robustness for unstable input data. ([#134](https://github.com/lynx-family/lynx-ui/pull/134))

## 3.131.0

### Patch Changes

- Updated dependencies [[`bc167c5`](https://github.com/lynx-family/lynx-ui/commit/bc167c5d03cdb344156e897c4d2d69f95bf7d29b)]:
  - @lynx-js/lynx-ui-common@3.131.0
  - @lynx-js/lynx-ui-draggable@3.131.0

## 3.130.0

### Patch Changes

- Update files field in all packages to include LICENSE file. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Updated dependencies [[`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520)]:
  - @lynx-js/lynx-ui-common@3.130.0
  - @lynx-js/lynx-ui-draggable@3.130.0
