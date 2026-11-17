# lynx-ui-sheet SKILL

## What It Is

`lynx-ui-sheet` is a headless Sheet primitive for ReactLynx. It supports bottom-sheet semantics and side-drawer semantics through the same composition model, state model, drag handling, backdrop, and snap-point APIs.

Use it when a UI needs a dismissible panel that slides from an edge of the viewport and may be controlled by refs, external state, snap points, or drag gestures.

## Building Blocks

- **`SheetRoot`**: Owns visibility state, side, snap points, drag behavior, and imperative methods.
- **`SheetView`**: Renders the sheet subtree in the overlay layer and controls mount/unmount.
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
- A main-axis content gesture holds an in-progress snap until touch-up or cancellation. If the Sheet takes over the drag, that drag replaces the pending snap. Arrival callbacks run only when the panel reaches its target.
- Direction recognition belongs to the whole touch: after a main-axis drag starts, reversals across the starting position retain the same recognizers and live scroll boundaries. A new touch can independently select a cross-axis child.
- The native coordinator uses the same `gestureConfig.minDistance` as the Sheet pan before selecting an axis. It continues observing boundaries during smaller movements so initial touch jitter cannot freeze the boundary before Sheet recognition.
- To isolate a same-axis native scrolling region, bind its own `NativeGesture`, call `manager.consumeGesture(true)` in its `onBegin` callback, and include it in `SheetNestedScrollContent.gestureRelations.waitFor`. An unbound region still participates in the ancestor pan.
- Use `gestureConfig` and `gestureRelations` on `SheetNestedScrollContent` only for recognition thresholds and external gesture relationships. Do not replace the Sheet pan or add per-scroll ownership policies.

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
- In `top` and `bottom` mode, percentage snap points resolve against the vertical main-axis basis: `screenHeight` when provided, otherwise viewport height.
- In horizontal modes (`left`, `right`, `start`, `end`), percentage snap points resolve against the horizontal main-axis basis: `screenWidth` when provided, otherwise viewport width.
- The `'fit'` snap point resolves to measured content height for `top` / `bottom`, and measured content width for horizontal modes.
- The inner layout uses `maxSnapSize`, the highest resolved `snapPoints` value, as its stable main-axis size so `flex: 1` children have a snap-related height/width basis. Pure `'fit'` snap point sheets stay content-driven.
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
- Put visual surface styles such as background, radius, and shadow on `SheetContent`.
- Use `innerClassName` / `innerStyle` for content layout, padding, and panel sizing.
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
