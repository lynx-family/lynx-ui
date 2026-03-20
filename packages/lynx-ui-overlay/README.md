# @lynx-js/lynx-ui-overlay

An Overlay component for Lynx. It renders content in a native overlay layer above the main view tree.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-overlay`)_

## Usage

The `lynx-ui-overlay` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Overlay)

## Component Structure

The `Overlay` component is composed of the following sub-components:

```tsx
<OverlayView>
  {/* Your custom content */}
</OverlayView>
```

- **`OverlayView`**: The main overlay container.

---

## About @lynx-js/lynx-ui

This component is a part of the `@lynx-js/lynx-ui` library, which is officially maintained by Lynx. As a **Headless** UI library long-term maintained by the Lynx team, we provide maximally flexible, universal and high-performance UI solutions.

## License

lynx-ui is Apache License 2.0 licensed.
