# @lynx-js/lynx-ui-popover

A headless Popover component for Lynx. It provides primitives for positioning and anchor tracking.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-popover`)_

## Usage

The `lynx-ui-popover` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Popover)

## Component Structure

The `Popover` component is composed of the following sub-components:

```tsx
<PopoverRoot>
  <PopoverTrigger />
  <PopoverPositioner>
    <PopoverContent>
      <PopoverArrow />
      {/* Your custom content */}
    </PopoverContent>
  </PopoverPositioner>
</PopoverRoot>
```

- **`PopoverRoot`**: The root container that manages open/close state.
- **`PopoverTrigger`**: The element that toggles the popover.
- **`PopoverAnchor`**: (Optional) An alternative anchor element for positioning.
- **`PopoverPositioner`**: Handles floating positioning relative to the anchor.
- **`PopoverContent`**: The popover panel content.
- **`PopoverArrow`**: (Optional) An arrow pointing to the anchor.
- **`PopoverBackdrop`**: (Optional) A backdrop overlay.

---

## About @lynx-js/lynx-ui

This component is a part of the `@lynx-js/lynx-ui` library, which is officially maintained by Lynx. As a **Headless** UI library long-term maintained by the Lynx team, we provide maximally flexible, universal and high-performance UI solutions.

## License

lynx-ui is Apache License 2.0 licensed.
