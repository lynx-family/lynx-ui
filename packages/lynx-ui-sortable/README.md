# @lynx-js/lynx-ui-sortable

A headless Sortable list component for ReactLynx. It provides list reordering primitives via main-thread animations.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-sortable`)_

## Usage

The `lynx-ui-sortable` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Sortable)

## Component Structure

The `Sortable` component is composed of the following sub-components:

```tsx
<SortableRoot>
  {(item) => (
    <SortableItem
      key={item.getSortingKey()}
      sortingKey={item.getSortingKey()}
    >
      <SortableItemArea>
        {/* Your item content */}
      </SortableItemArea>
    </SortableItem>
  )}
</SortableRoot>
```

- **`SortableRoot`**: The root container that manages the sortable state.
- **`SortableItem`**: An individual sortable item.
- **`SortableItemArea`**: The draggable area within a sortable item.

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
