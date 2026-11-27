---
"@lynx-js/lynx-ui-sheet": minor
"@lynx-example/lynx-ui-sheet": patch
---

Add opt-in `useSheetSurface({ frame, cornerRadius })` and `SheetSurfaceHandle` (`surface` prop on `SheetContent` / `SheetNestedScrollContent`) for floating constraint frames (`insets`, `width`, `maxWidth`, `align`), exposed corner radii with unified replace semantics, and synchronous main-thread `SheetSurfaceController` updates (`setFrame`, `setCornerRadius`, `getViewportSize`) with zero bundle cost when unused.

Add self-contained `SheetBody` with four-sided hardware-clipped `viewportInsets` (including RTL `start`/`end`), `bodyViewProps`, multi-body subscription, and a constant view hierarchy that never remounts children across inset or snap changes.

Support `{ fit: { min?, max? } }` snap points, auto-measured `SheetPositioner` bounds with `onSizeChange` and sibling `SheetBackdrop`, finger-anchored rubber-band state (`sheetDrag`) with nested-scroll `atEnd` tracking, and main-thread `onDragStart` (once per gesture), `onPositionChange`, and `onPresenceChange` callbacks.
