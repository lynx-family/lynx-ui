# @lynx-js/lynx-ui-popover

## 3.130.0

### Minor Changes

- feat: Make the controlled mode and controlled/uncontrolled mixed mode more robust. ([#77](https://github.com/lynx-family/lynx-ui/pull/77))

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

- optimize: fix type errors ([#77](https://github.com/lynx-family/lynx-ui/pull/77))

- Update files field in all packages to include LICENSE file. ([#77](https://github.com/lynx-family/lynx-ui/pull/77))

- Updated dependencies [[`cf9c6a0`](https://github.com/lynx-family/lynx-ui/commit/cf9c6a099d3fc1edeff66ebd77a09f60624dcd35), [`cf9c6a0`](https://github.com/lynx-family/lynx-ui/commit/cf9c6a099d3fc1edeff66ebd77a09f60624dcd35), [`cf9c6a0`](https://github.com/lynx-family/lynx-ui/commit/cf9c6a099d3fc1edeff66ebd77a09f60624dcd35), [`cf9c6a0`](https://github.com/lynx-family/lynx-ui/commit/cf9c6a099d3fc1edeff66ebd77a09f60624dcd35), [`cf9c6a0`](https://github.com/lynx-family/lynx-ui/commit/cf9c6a099d3fc1edeff66ebd77a09f60624dcd35), [`cf9c6a0`](https://github.com/lynx-family/lynx-ui/commit/cf9c6a099d3fc1edeff66ebd77a09f60624dcd35), [`cf9c6a0`](https://github.com/lynx-family/lynx-ui/commit/cf9c6a099d3fc1edeff66ebd77a09f60624dcd35), [`cf9c6a0`](https://github.com/lynx-family/lynx-ui/commit/cf9c6a099d3fc1edeff66ebd77a09f60624dcd35)]:
  - @lynx-js/lynx-ui-common@3.130.0
  - @lynx-js/lynx-ui-presence@3.130.0
  - @lynx-js/lynx-ui-overlay@3.130.0
  - @lynx-js/lynx-ui-button@3.130.0
