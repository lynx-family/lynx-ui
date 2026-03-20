# @lynx-js/lynx-ui-draggable

A headless Draggable component for Lynx. It provides drag-and-drop primitives via main-thread execution.

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
    <Draggable>
      {/* Your custom content */}
    </Draggable>
  </DraggableArea>
</DraggableRoot>
```

- **`DraggableRoot`**: The root container that manages the state and logic.
- **`DraggableArea`**: The defined area where items can be dragged.
- **`Draggable`**: The actual draggable item.

### Hooks

- **`useDraggable`**: A hook for custom draggable implementations with main-thread callbacks.

---

## About @lynx-js/lynx-ui

This component is a part of the `@lynx-js/lynx-ui` library, which is officially maintained by Lynx. As a **Headless** UI library long-term maintained by the Lynx team, we provide maximally flexible, universal and high-performance UI solutions.

## License

lynx-ui is Apache License 2.0 licensed.
