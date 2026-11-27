---
"@lynx-js/lynx-ui-sheet": minor
"@lynx-js/lynx-ui-overlay": patch
"@lynx-example/lynx-ui-sheet": patch
---

Replace surface insets API with constraint-box `initialFrame` / `setFrame` (`insets`, `width`, `maxWidth`, `align`) and `getViewportSize()`, allow sibling `SheetBackdrop` + `SheetPositioner` (`pointerEvents: 'none'` on positioner, `onSizeChange`), support `{ fit: { min?, max? } }` snap points and horizontal `'fit'` drawers in `SheetBody`, expose `main-thread:onPresenceChange`, auto-settle `{ animating: true }` frame updates, default painted surface `implicit-animation` to `'false'`, and complete `overlayViewProps` typing in `lynx-ui-overlay`.
