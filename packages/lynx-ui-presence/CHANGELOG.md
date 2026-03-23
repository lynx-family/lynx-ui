# @lynx-js/lynx-ui-presence

## 3.130.0

### Minor Changes

- feat: Make the controlled mode and controlled/uncontrolled mixed mode more robust. ([#74](https://github.com/lynx-family/lynx-ui/pull/74))

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

- optimize: fix type errors ([#74](https://github.com/lynx-family/lynx-ui/pull/74))

- Update files field in all packages to include LICENSE file. ([#74](https://github.com/lynx-family/lynx-ui/pull/74))

- Updated dependencies [[`ee80ca3`](https://github.com/lynx-family/lynx-ui/commit/ee80ca3d8e954f5bfe40efdf0376407114694308), [`ee80ca3`](https://github.com/lynx-family/lynx-ui/commit/ee80ca3d8e954f5bfe40efdf0376407114694308), [`ee80ca3`](https://github.com/lynx-family/lynx-ui/commit/ee80ca3d8e954f5bfe40efdf0376407114694308), [`ee80ca3`](https://github.com/lynx-family/lynx-ui/commit/ee80ca3d8e954f5bfe40efdf0376407114694308), [`ee80ca3`](https://github.com/lynx-family/lynx-ui/commit/ee80ca3d8e954f5bfe40efdf0376407114694308), [`ee80ca3`](https://github.com/lynx-family/lynx-ui/commit/ee80ca3d8e954f5bfe40efdf0376407114694308)]:
  - @lynx-js/lynx-ui-common@3.130.0
