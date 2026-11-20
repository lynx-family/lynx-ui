---
"@lynx-js/lynx-ui-sheet": minor
---

Add `SheetBody` with four-sided transform-and-clip `viewportInsets` (including RTL `start`/`end`) to keep body content inside safe-area bounds with zero layout writes during steady drags and single-pass horizontal widening.

Replace `panelLayout` and `main-thread:surfaceRef` with explicit `insets` (`SheetInsets`), `cornerRadius` (`SheetCornerRadius`), and stateless `main-thread:surfaceControllerRef` (`SheetSurfaceController`) for synchronous main-thread surface and safe-area updates without background-thread round trips.

Expose `main-thread:onDragStart` and `main-thread:onPositionChange` on `SheetRoot`, make `SheetPositioner` `width` and `height` optional with `inset: 0` auto-measurement, wire `SheetFooter` directly on the main thread, eliminate per-frame clip layout during enter/exit/gap animations, and restore dragging across empty vertical surface space below `fit` content.
