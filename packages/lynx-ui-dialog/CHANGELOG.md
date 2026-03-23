# @lynx-js/lynx-ui-dialog

## 3.130.0

### Minor Changes

- feat: Make the controlled mode and controlled/uncontrolled mixed mode more robust. ([#67](https://github.com/lynx-family/lynx-ui/pull/67))

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

- Update files field in all packages to include LICENSE file. ([#67](https://github.com/lynx-family/lynx-ui/pull/67))

- Updated dependencies [[`bc45259`](https://github.com/lynx-family/lynx-ui/commit/bc45259dc7a9299b9f2b1922ec3668deac3461a7), [`bc45259`](https://github.com/lynx-family/lynx-ui/commit/bc45259dc7a9299b9f2b1922ec3668deac3461a7), [`bc45259`](https://github.com/lynx-family/lynx-ui/commit/bc45259dc7a9299b9f2b1922ec3668deac3461a7), [`bc45259`](https://github.com/lynx-family/lynx-ui/commit/bc45259dc7a9299b9f2b1922ec3668deac3461a7), [`bc45259`](https://github.com/lynx-family/lynx-ui/commit/bc45259dc7a9299b9f2b1922ec3668deac3461a7), [`bc45259`](https://github.com/lynx-family/lynx-ui/commit/bc45259dc7a9299b9f2b1922ec3668deac3461a7), [`bc45259`](https://github.com/lynx-family/lynx-ui/commit/bc45259dc7a9299b9f2b1922ec3668deac3461a7), [`bc45259`](https://github.com/lynx-family/lynx-ui/commit/bc45259dc7a9299b9f2b1922ec3668deac3461a7)]:
  - @lynx-js/lynx-ui-common@3.130.0
  - @lynx-js/lynx-ui-presence@3.130.0
  - @lynx-js/lynx-ui-overlay@3.130.0
  - @lynx-js/lynx-ui-button@3.130.0
