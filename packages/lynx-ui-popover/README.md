# @lynx-js/lynx-ui-popover

A headless Popover component for ReactLynx. It provides primitives for positioning and anchor tracking.

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
  <PopoverAnchor />
  <PopoverPositioner>
    <PopoverBackdrop />
    <PopoverContent>
      <PopoverArrow />
    </PopoverContent>
  </PopoverPositioner>
</PopoverRoot>
```

- **`PopoverRoot`**: The root container that manages open/close state.
- **`PopoverTrigger`**: The element that toggles the popover.
- **`PopoverAnchor`**: An alternative anchor element for positioning.
- **`PopoverPositioner`**: Handles floating positioning relative to the anchor.
- **`PopoverBackdrop`**: A backdrop overlay.
- **`PopoverContent`**: The popover panel content.
- **`PopoverArrow`**: An arrow pointing to the anchor.

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
