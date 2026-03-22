# @lynx-js/lynx-ui-draggable

A headless Draggable component for ReactLynx. It provides drag-and-drop primitives via main-thread execution.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-draggable`)_

## Usage

The `lynx-ui-draggable` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Draggable)

## Component Structure

The `Draggable` component is composed of several specialized sub-components to give you full control over the layout and styling.

```tsx
<DraggableRoot>
  <DraggableArea>
    <Draggable />
  </DraggableArea>
</DraggableRoot>
```

- **`DraggableRoot`**: The root container that manages the state and logic.
- **`DraggableArea`**: The defined area where items can be dragged.
- **`Draggable`**: The actual draggable item.
- **`useDraggable`**: A hook for custom draggable implementations.

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
