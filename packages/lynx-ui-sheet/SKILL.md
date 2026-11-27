# lynx-ui-sheet SKILL

## What It Is

`lynx-ui-sheet` is a headless Sheet primitive for ReactLynx. It supports bottom-sheet semantics and side-drawer semantics through the same composition model, state model, drag handling, backdrop, and snap-point APIs.

Use it when a UI needs a dismissible panel that slides from an edge of the viewport and may be controlled by refs, external state, snap points, or drag gestures.

## Building Blocks

- **`SheetRoot`**: Owns visibility state, side, snap points, drag behavior, and imperative methods.
- **`SheetView`**: Renders the sheet subtree in the overlay layer and controls mount/unmount.
- **`SheetPositioner`**: Optionally establishes a local viewport. Wrap
  `SheetBackdrop` and content together for a localized scrim, or place
  `SheetBackdrop` as a sibling inside `SheetView` for a full-screen scrim with a
  constrained sheet viewport (such as asymmetric safe areas). Supply positive
  `width` and `height` in logical pixels from the host pane, or omit them to
  auto-measure the positioner's own bounds on layout. Pass numeric or `'px'`
  edge offsets (`left`/`right`/`top`/`bottom`) in `style` to constrain the
  positioner and automatically subtract them from fallback viewport dimensions
  before the first layout measurement completes. Pass `onSizeChange` to observe
  resolved local viewport bounds for custom snap formulas without duplicating
  layout listeners. Use `style` to place it inside `SheetView`. Do not override
  explicit dimensions through CSS. Without it, the existing viewport path and
  opening flow remain unchanged.
- **`SheetBackdrop`**: Renders the scrim behind the sheet and optionally closes the sheet on tap.
- **`SheetContent`**: Renders the moving sheet or drawer surface and receives consumer sizing/styling.
- **`SheetNestedScrollContent`**: Content layer that coordinates sheet dragging and nested native scrolling. Keep `SheetContent` for the existing raw-touch behavior.
- **`SheetFooter`**: Optional footer for bottom sheets. Place one directly inside either content component, outside scrolling nodes.
- **`SheetHandle`**: Optional drag handle. It renders its `children`, so custom handle visuals can be placed directly inside the draggable target. Use it for bottom sheets when a visible handle is desired; horizontal drawers usually do not need it unless the design intentionally calls for a side grip.

## Nested Scroll Rules

- Enable `enableNewGesture: true` and use LynxSDK 3.2 or newer.
- Use `SheetNestedScrollContent` for nested native scrolling with `scroll-view` or `list`.
- Prefer its render prop for a nearby scroll node: bind `scrollGesture` to the outermost vertical scrolling node with `main-thread:gesture`.
- In deeply nested content, call the argument-free `useSheetScrollGesture()` Hook. It returns the same gesture object created by the nearest `SheetNestedScrollContent`; it does not create or configure another gesture.
- The ownership rule is fixed and directionally natural: upward drags expand the Sheet to its maximum snap before content scrolls; downward drags scroll content to its start before the Sheet collapses. Handoff can occur without lifting the finger.
- Native content bounce belongs to the scroll node, not `SheetRoot.rubberBand`. Enable `bounces` on the native node when edge feedback is wanted. Do not layer another resistance transform on the same content movement.
- When native events report both start and end boundaries, the target has no scroll range and Sheet retains upper resistance. An unknown scroll range preserves the usual maximum-snap handoff; do not infer available scrolling from `getScrollInfo().scrollRange`, whose meaning differs across native implementations.
- A main-axis content gesture holds an in-progress snap until touch-up or cancellation. If the Sheet takes over the drag, that drag replaces the pending snap. Arrival callbacks run only when the panel reaches its target.
- Direction recognition belongs to the whole touch: after a main-axis drag starts, reversals across the starting position retain the same recognizers and live scroll boundaries. A new touch can independently select a cross-axis child.
- The native coordinator uses the same `gestureConfig.minDistance` as the Sheet pan before selecting an axis. It continues observing boundaries during smaller movements so initial touch jitter cannot freeze the boundary before Sheet recognition.
- To isolate a same-axis native scrolling region, bind its own `NativeGesture`, call `manager.consumeGesture(true)` in its `onBegin` callback, and include it in `SheetNestedScrollContent.gestureRelations.waitFor`. An unbound region still participates in the ancestor pan.
- Use `gestureConfig` and `gestureRelations` on `SheetNestedScrollContent` only for recognition thresholds and external gesture relationships. Do not replace the Sheet pan or add per-scroll ownership policies.

## Snap Start Rules

- Use `main-thread:onSnapStart(index, value, animated)` on `SheetRoot` to react to the selected target before Sheet starts moving. It fires on drag release and imperative snaps, including same-point releases and handoff to nested scrolling at the maximum snap.
- The callback does not fire for opening or closing. `animated` is false for an immediate snap. It reports a target, not per-frame animation progress or completed arrival.
- Use `onSnapChange` for a settled snap index change. After a nested scroll handoff, the Sheet waits for touch-up before reporting the final snap.
- Intrinsic content changes resize an idle `'fit'` panel with an immediate snap; this also notifies `onSnapStart` with `animated={false}`. Active drags, numeric destinations, and closing panels retain their current motion.
- Fullscreen is a consumer policy. Compare the resolved target with the consumer's fullscreen size; the largest snap need not be fullscreen.
- Use `className` / `style` to style the painted surface and `innerClassName` / `innerStyle` for content layout. For independently timed CSS transitions, update the target once after `onSnapStart`; initialize the opening style and handle interrupted transitions in the consumer.
- A background-thread state update followed by a CSS transition has its own clock. It does not synchronize with the Sheet spring. Keep live text and controls unscaled; animating actual width can reflow text and still incurs layout work. Do not expose or mutate the movement ref to implement companion styles.

## Rubber-Band Rules

- Sheet-owned resistance follows raw finger displacement, not a repeatedly compressed motion value. Holding a stationary finger must hold the current stretch; reverse movement unwinds it before ordinary Sheet movement resumes.
- Recognizer completion or nested handoff is not touch release. Snap selection and rebound belong to touch-up or cancellation, including native touch completion when the Sheet pan no longer owns the recognizer.
- A fresh swipe toward expansion inside scrollable content can take ownership during the Sheet's rebound from its maximum snap. A new handle drag can still interrupt that rebound and continue the stretch.
- Resistance geometry is sampled when Sheet acquires a drag. A positioner resize changes the live handoff and release targets without repeatedly remapping an existing stretch. A new ownership segment samples the current geometry; imperative position changes rebase the drag.
- Keep enabled-rubber gesture regressions: equivalent event partitions, monotonic over-drag, stationary holds, reversals, interrupted stretch, and both touch-completion orders. Mock the runtime, not the resistance configuration.

## Panel and Body Layout

- Omit `frame`/`initialFrame` and `cornerRadius`/`initialCornerRadius` to retain extended background coverage and the original content layout.
- Set `initialFrame={{ insets: { bottom: 8 } }}` (or `{ insets: { left: 16, right: 16, bottom: 8 }, maxWidth: 664 }`) for a bounded floating panel. `insets` define minimum edge margins, `width` and `maxWidth` accept logical pixels, `'px'` strings, or `'%'` strings of the local viewport width clamped to `screenWidth - left - right`, and `align` (`'start' | 'center' | 'end'`, default `'center'`) distributes remaining horizontal slack (respecting `enableRTL`). The bottom inset is external and does not count toward a snap size. Zero insets with zero bottom corners preserve attached coverage without a mode trap.
- Use reactive `frame` and `cornerRadius` props for React-driven updates while open (for example non-draggable layout/safe-area changes). Use `initialFrame` and `initialCornerRadius` with `main-thread:surfaceControllerRef` (`setFrame`, `setCornerRadius`, `getViewportSize`) when driving main-thread animations from `main-thread:onSnapStart`, `main-thread:onDragStart`, and `main-thread:onPositionChange`. `setFrame` replaces the full geometry frame (`insets`, `width`, `maxWidth`, `align`), so omitted or `undefined` fields reset to defaults; use `getViewportSize()` when interpolating mixed pixel/percentage endpoints without mirroring viewport state in React.
- Pass `{ animating: true }` to `setFrame(frame, { animating: true })` during intermediate animation frames when animating `bottom` so viewport layout bounds do not re-layout per frame; omit `{ animating: true }` on the final frame or one-shot updates so viewport bounds commit safely (with an automatic 2-frame idle fallback settle if interrupted without a final non-animating call).
- Use `main-thread:onPresenceChange` to reset or stop coordinated main-thread companion animations cleanly across open (`'entering'` / `'entered'`), close (`'exiting'` / `'exited'`), and drag resurrection (`'exiting'` -> `'entering'`, emitted before `main-thread:onDragStart`).
- `setFrame` horizontal changes update the painted surface and `SheetBody`'s horizontal safe-area clamping synchronously in one layout pass, avoiding two-pass `layoutchange` cascades.
- Use `initialCornerRadius={24}` / `cornerRadius={24}` (or `setCornerRadius(24)`) to round exposed sheet corners, including the clipped bottom edge of a floating sheet. Supply an object for asymmetric shapes. With `setCornerRadius({...})`, omitted (`undefined`) corners preserve their current override and explicit `null` restores CSS on that corner (`setCornerRadius(undefined)` restores all four corners to CSS). Omitted clipped bottom corners are square.
- All bounded bottom panels translate and clip at a fixed surface height using compositor transforms on `clipMTRef` (zero `clip.bottom` layout writes across open, drag, settle, and close), reserving `clip-path` strictly for rounded bottom corners.
- In a flex content layout, place `SheetBody` next to a handle that should keep moving when the body reaches a viewport boundary. Its optional `viewportInsets` support `top`, `right`, `bottom`, `left`, plus logical `start`/`end` resolved with `enableRTL`. All four sides (including horizontal `'fit'` drawers) support transform + clip and safe-area reservation with zero per-frame layout during drags.
- A `'fit'` snap with `SheetBody` viewport insets measures along the cross axis at its safe size and reserves remaining edge safe-area clearance on the open edge. Use `snapPoints={[{ fit: { min, max } }]}` (in pixels, `'px'` strings, or viewport `'%'`) to bound total `'fit'` panel size (including safe-area reserve and `SheetFooter`) without manually subtracting safe-area overlap in CSS or resolving `150vh` percentages.
- Inset `fit` uses the compact measurement while an appearance animation changes the panel width. A change to the local viewport width or horizontal insets can establish a new compact size.
- Use one `SheetBody` per content element. Explicit snaps let the body occupy the remaining space in the content layout. Fit sheets keep the body's intrinsic layout.
- Bind `scrollGesture` to the same native scroll view inside the body. Moving that body requires no extra pan gesture.
- Use surface `className` and `style` for paint. Use `innerClassName` and `innerStyle` for child layout.

## Footer Rules

- `SheetFooter` supports `side="bottom"`; use ordinary layout content for other sides.
- Position and animation belong to the Sheet; do not drive footer visibility with `onClose`.
- Style its content through `className` and `style`; position, transform, and transition are reserved.
- Use `onHeightChange` to reserve bottom padding in custom scroll containers. It runs on layout changes, not gesture frames. The Sheet does not mutate scroll padding.
- A 'fit' snap adds the measured footer height to intrinsic body height. Do not add the footer height again to the body's intrinsic height.
- Supply safe-area padding through styles. Keyboard avoidance is not automatic.

## Side Rules

- Use `side="bottom"` for bottom sheets. This is the default and preserves existing behavior.
- Use `side="top"` for top sheets.
- Use `side="left"` or `side="right"` for drawer-style panels that should stay on a physical edge.
- Use `side="start"` or `side="end"` for drawer-style panels that should follow writing direction. These resolve to the physical edge from `enableRTL`.
- In `top` and `bottom` mode, percentage snap points use the positioner height
  when present, otherwise `screenHeight` or the existing viewport fallback.
- In horizontal modes (`left`, `right`, `start`, `end`), percentage snap points
  use the positioner width when present, otherwise `screenWidth` or the
  existing viewport fallback.
- Positioner resizing retains the snap index, updates an idle snap immediately,
  and retargets running animations without another snap-start notification.
  Drag positions and native scroll nodes stay intact. Intrinsic `fit` sizing
  still follows content layout; it does not require a positioner query.
- Positioner placement, `initialFrame` relative to the viewport edges, and content
  safe-area padding are separate layout concerns.
- The `'fit'` snap point resolves to measured content height for `top` / `bottom`, and measured content width for horizontal modes.
- Numeric-snap sheets share a stable content size based on the largest snap. A bottom `'fit'` snap resolves from intrinsic content and is capped at the space available above the configured gap. Use a scrollable for content beyond the visible area.
- `screenHeight` can override the height basis for `top` / `bottom`; `screenWidth` can override the width basis for horizontal modes.
- Rubber-band over-drag defaults to enabled for `top` / `bottom` and disabled for horizontal modes. Use `rubberBand` to override the default.

## State Model

- Use `defaultShow` for uncontrolled initial visibility.
- Use `show` with `onShowChange` for controlled visibility.
- Use a `SheetRootRef` to call `open`, `close`, `snapTo`, `expand`, or `collapse` imperatively.
- In controlled mode, always update the external `show` state from `onShowChange`; the component will not own that state for you.
- `onOpen` runs after the enter animation completes. `onClose` runs after the exit animation completes.

## Styling Rules

- Keep `Sheet` headless: do not add default visual classes or styles in the component package.
- Put visual surface styles such as background, radius, and shadow on `SheetContent`, or use `innerClassName` / `innerStyle` when the inner panel needs independent styling or width.
- Use `surfaceViewProps` for native outer-surface view attributes and `innerViewProps` for native inner-panel view attributes. Sheet retains its measurement, gestures, class name, and style; use `className`/`style` and `innerClassName`/`innerStyle` for styling.
- The Sheet controls the inner panel size on the snap axis.
- A narrower inner panel needs Lynx SDK 3.5 or newer for taps outside it to reach the backdrop. On older SDKs, constrain the outer surface instead.
- For horizontal drawers, set the drawer width with `innerClassName` / `innerStyle` so `'fit'` can resolve from the measured drawer width.
- Horizontal drawers should usually be full height and use inner padding for safe-area or visual breathing room.
- Put custom handle visuals inside `SheetHandle` instead of layering a separate invisible hit target over a visual handle.
- Do not add a bottom-sheet pill handle to horizontal drawer examples unless the design intentionally calls for a side grip.

## Verification

- Run `pnpm --filter @lynx-js/lynx-ui-sheet test -- --run` after changing snap, side, drag, or nested-scroll helpers.
- Run `pnpm --filter @lynx-js/lynx-ui-sheet build` after public API or type changes.
- Run `pnpm --filter @lynx-example/lynx-ui-sheet build` after example changes.
- Run `pnpm check:exports` when exported types or aggregate exports change.
- Manually validate bottom, top, left, right, start, and end sides when changing main-thread transform, gesture, or presence logic. Include `enableRTL={false}` and `enableRTL={true}` coverage for logical drawer sides.

## Prompt Formula

Use this formula when asking an agent to build with `Sheet`:

> Side (`bottom` / `top` / `left` / `right` / `start` / `end`) + RTL mode (`enableRTL`, when logical drawers matter) + State model (`defaultShow`, controlled `show`, or ref methods) + Snap-point behavior (`fit`, pixels, or percentages) + Surface sizing/styling + Close behavior.

Examples:

- "Create a start drawer using `SheetRoot side=\"start\" enableRTL`, controlled by a ref, with `snapPoints={['72%']}` and backdrop tap to close."
- "Create a left drawer using `SheetRoot side=\"left\"` when the panel should stay on the physical left edge regardless of `enableRTL`."
- "Create a bottom sheet with `snapPoints={['fit', '80%']}`, a custom visual inside `SheetHandle`, and an inner content layout using L.U.N.A tokens."
- "Convert a bottom sheet to an end drawer; keep visual surface styles on `SheetContent` and move drawer width plus inner padding to `innerClassName`."
