# @lynx-js/lynx-ui-presence

## 3.135.3

### Patch Changes

- Updated dependencies [[`44c1de6`](https://github.com/lynx-family/lynx-ui/commit/44c1de68cf47e03c5136431a9efea7cbee69e752)]:
  - @lynx-js/lynx-ui-common@3.135.3

## 3.134.0

### Patch Changes

- Fix presence edge cases for rapid visibility toggles during enter and exit transitions: ([#204](https://github.com/lynx-family/lynx-ui/pull/204))

  - Recover when an enter interrupts an in-progress exit.
  - Keep open and close callbacks balanced across interrupted transitions.
  - Remove mounted containers when dismissal occurs before entering starts.
  - Handle cancelled Dialog transitions during rapid visibility changes.

## 3.133.1

### Patch Changes

- Updated dependencies [[`3932070`](https://github.com/lynx-family/lynx-ui/commit/393207073522e221a79e65c643df2afb329ec931)]:
  - @lynx-js/lynx-ui-common@3.133.1

## 3.133.0

### Patch Changes

- Updated dependencies [[`85d2e9d`](https://github.com/lynx-family/lynx-ui/commit/85d2e9d12e9aeee3256856f1be0076524ddb7d8a)]:
  - @lynx-js/lynx-ui-common@3.133.0

## 3.131.0

### Patch Changes

- Updated dependencies [[`bc167c5`](https://github.com/lynx-family/lynx-ui/commit/bc167c5d03cdb344156e897c4d2d69f95bf7d29b)]:
  - @lynx-js/lynx-ui-common@3.131.0

## 3.130.0

### Minor Changes

- feat: Make the controlled mode and controlled/uncontrolled mixed mode more robust. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

  - `@lynx-js/lynx-ui-presence`:
    - Refactor `usePresence` to support better mixed controlled mode.
    - Add `debugLog` prop for debugging presence state transitions.
  - `@lynx-js/lynx-ui-popover`:
    - Add `PopoverBackdrop` component.
    - Support robust controlled mode via `isControlled` and `onVisibleChange`.
    - Fix animation/transition cancel event handling.
  - `@lynx-js/lynx-ui-dialog`:
    - Update to use the robust presence logic.

### Patch Changes

- optimize: fix type errors ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Update files field in all packages to include LICENSE file. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Updated dependencies [[`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520)]:
  - @lynx-js/lynx-ui-common@3.130.0
