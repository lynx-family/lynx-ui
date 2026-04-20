# lynx-ui-sheet SKILL

## What It Is

`lynx-ui-sheet` is a headless Sheet primitive for ReactLynx. It supports bottom-sheet semantics and side-drawer semantics through the same composition model, state model, drag handling, backdrop, and snap-point APIs.

Use it when a UI needs a dismissible panel that slides from an edge of the viewport and may be controlled by refs, external state, snap points, or drag gestures.

## Building Blocks

- **`SheetRoot`**: Owns visibility state, direction, snap points, drag behavior, and imperative methods.
- **`SheetView`**: Renders the sheet subtree in the overlay layer and controls mount/unmount.
- **`SheetBackdrop`**: Renders the scrim behind the sheet and optionally closes the sheet on tap.
- **`SheetContent`**: Renders the moving sheet or drawer surface and receives consumer sizing/styling.
- **`SheetHandle`**: Optional drag handle. Use it for bottom sheets when a visible handle is desired; horizontal drawers usually do not need it.

## Direction Rules

- Use `direction="bottom"` for bottom sheets. This is the default and preserves existing behavior.
- Use `direction="left"` or `direction="right"` for drawer-style panels.
- In `bottom` mode, percentage snap points resolve against viewport height.
- In `left` and `right` mode, percentage snap points resolve against viewport width.
- The `'fit'` snap point resolves to measured content height for `bottom`, and measured content width for `left` / `right`.
- `screenHeight` can override the height basis for `bottom`; `screenWidth` can override the width basis for `left` / `right`.

## State Model

- Use `defaultShow` for uncontrolled initial visibility.
- Use `show` with `onShowChange` for controlled visibility.
- Use a `SheetRootRef` to call `open`, `close`, `snapTo`, `expand`, or `collapse` imperatively.
- In controlled mode, always update the external `show` state from `onShowChange`; the component will not own that state for you.
- `onOpen` runs after the enter animation completes. `onClose` runs after the exit animation completes.

## Styling Rules

- Keep `Sheet` headless: do not add default visual classes or styles in the component package.
- Put visual surface styles such as background, radius, shadow, width, and height on `SheetContent`.
- For horizontal drawers, size the visible drawer with `className` / `style` on `SheetContent`, not `innerClassName` / `innerStyle`.
- Use `innerClassName` / `innerStyle` for content layout and padding inside the sheet surface.
- Horizontal drawers should usually be full height and use inner padding for safe-area or visual breathing room.
- Do not add a bottom-sheet pill handle to horizontal drawer examples unless the design intentionally calls for a side grip.

## Verification

- Run `pnpm --filter @lynx-js/lynx-ui-sheet test -- --run` after changing snap, direction, or drag helpers.
- Run `pnpm --filter @lynx-js/lynx-ui-sheet build` after public API or type changes.
- Run `pnpm --filter @lynx-example/lynx-ui-sheet build` after example changes.
- Run `pnpm check:exports` when exported types or aggregate exports change.
- Manually validate bottom, left, and right directions when changing main-thread transform, gesture, or presence logic.

## Prompt Formula

Use this formula when asking an agent to build with `Sheet`:

> Direction (`bottom` / `left` / `right`) + State model (`defaultShow`, controlled `show`, or ref methods) + Snap-point behavior (`fit`, pixels, or percentages) + Surface sizing/styling + Close behavior.

Examples:

- "Create a left drawer using `SheetRoot direction=\"left\"`, controlled by a ref, with `snapPoints={['72%']}` and backdrop tap to close."
- "Create a bottom sheet with `snapPoints={['fit', '80%']}`, a handle, and an inner content layout using L.U.N.A tokens."
- "Convert a bottom sheet to a right drawer; move width and surface styles to `SheetContent` and keep inner padding in `innerClassName`."
