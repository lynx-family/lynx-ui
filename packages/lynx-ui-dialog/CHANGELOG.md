# @lynx-js/lynx-ui-dialog

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

- Update files field in all packages to include LICENSE file. ([#79](https://github.com/lynx-family/lynx-ui/pull/79))

- Updated dependencies [[`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520), [`bc1d954`](https://github.com/lynx-family/lynx-ui/commit/bc1d9544d25c5483f5bf199dd279094b8d669520)]:
  - @lynx-js/lynx-ui-common@3.130.0
  - @lynx-js/lynx-ui-presence@3.130.0
  - @lynx-js/lynx-ui-overlay@3.130.0
  - @lynx-js/lynx-ui-button@3.130.0
