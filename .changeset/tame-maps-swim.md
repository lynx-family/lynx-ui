---
"@lynx-js/lynx-ui-popover": minor
"@lynx-js/lynx-ui-presence": minor
"@lynx-js/lynx-ui-dialog": minor
---

feat: Make the controlled mode and controlled/uncontrolled mixed mode more robust.

- `@lynx-js/lynx-ui-presence`:
  - Refactor `usePresence` to support better mixed controlled mode.
  - Add `debugLog` prop for debugging presence state transitions.
- `@lynx-js/lynx-ui-popover`:
  - Add `PopoverBackdrop` component.
  - Support robust controlled mode via `isControlled` and `onVisibleChange`.
  - Fix animation/transition cancel event handling.
- `@lynx-js/lynx-ui-dialog`:
  - Update to use the robust presence logic.
