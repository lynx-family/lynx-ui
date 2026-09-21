# @lynx-js/lynx-ui-sheet

A directional Sheet component for ReactLynx. It supports bottom-sheet and side-drawer semantics with drag interactions and snap point primitives.

## Installation

We strongly recommend installing and using this component through the main `@lynx-js/lynx-ui` package:

```bash
# pnpm (recommended)
pnpm add @lynx-js/lynx-ui

# npm
npm install @lynx-js/lynx-ui

# yarn
yarn add @lynx-js/lynx-ui
```

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-sheet`)_

## Usage

The `lynx-ui-sheet` follows a headless composition pattern. You can control its visibility via a `ref` and define its behavior using properties like `side`, `enableRTL`, `snapPoints`, and `initialSnap`.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Sheet)

## Component Structure

The `Sheet` component is composed of several specialized sub-components to give you full control over the layout and styling.

```tsx
<SheetRoot>
  <SheetView>
    <SheetBackdrop />
    <SheetContent>
      <SheetHandle />
    </SheetContent>
  </SheetView>
</SheetRoot>
```

- **`SheetRoot`**: The root container that manages the state, side, logical RTL resolution, snap points, and drag logic.
- **`SheetView`**: The viewport container for the sheet components.
- **`SheetBackdrop`**: The dimmed overlay behind the sheet. Can be configured to close the sheet on tap.
- **`SheetContent`**: The actual sliding panel that contains your content.
- **`SheetGestureContent`**: A gesture-runtime backed replacement for
  `SheetContent`, intended for nested scrolling.
- **`SheetHandle`**: (Optional) A draggable visual indicator (usually a small bar) at the top of the sheet content.

## Nested scrolling

Replace only the content layer with `SheetGestureContent`, then bind its
coordinated gesture to the outermost vertical native scrolling node. The render
prop is the most explicit path:

```tsx
<SheetRoot snapPoints={['40%', '90%']}>
  <SheetView>
    <SheetBackdrop />
    <SheetGestureContent>
      {({ scrollGesture }) => (
        <list main-thread:gesture={scrollGesture}>
          {/* list items */}
        </list>
      )}
    </SheetGestureContent>
  </SheetView>
</SheetRoot>
```

For deeply nested content, use the argument-free Hook instead of forwarding the
gesture through every component:

```tsx
function Results() {
  const scrollGesture = useSheetScrollGesture()
  return <list main-thread:gesture={scrollGesture}>{/* list items */}</list>
}
```

Both access paths expose the same gesture created by the nearest
`SheetGestureContent`; calling the Hook does not create another recognizer. Bind
it to the outermost vertical scrolling node. The built-in ownership rule matches
common bottom-sheet behavior: an upward drag expands the Sheet to its maximum
snap before content scrolls, while a downward drag scrolls content back to its
start before the Sheet collapses. Both transfers can occur without lifting the
finger. A region that should scroll independently simply does not bind this
gesture.

`gestureConfig` and `gestureRelations` remain available on
`SheetGestureContent` for recognition thresholds and relationships with external
gestures. They configure the single coordinator rather than individual scrolling
nodes.

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
