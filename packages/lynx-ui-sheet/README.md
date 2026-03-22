# @lynx-js/lynx-ui-sheet

A Bottom Sheet component for ReactLynx. It provides drag interactions and snap point primitives.

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

The `lynx-ui-sheet` follows a headless composition pattern. You can control its visibility via a `ref` and define its behavior using properties like `snapPoints` and `initialSnap`.

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

- **`SheetRoot`**: The root container that manages the state, snap points, and drag logic.
- **`SheetView`**: The viewport container for the sheet components.
- **`SheetBackdrop`**: The dimmed overlay behind the sheet. Can be configured to close the sheet on tap.
- **`SheetContent`**: The actual sliding panel that contains your content.
- **`SheetHandle`**: (Optional) A draggable visual indicator (usually a small bar) at the top of the sheet content.

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
