# @lynx-js/lynx-ui-button

A headless Button component for Lynx. It provides press state tracking (`active`) and render props for custom styling.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-button`)_

## Usage

The `lynx-ui-button` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Button)

## Component Structure

The `Button` component is composed of the following sub-components:

```tsx
<Button>
  {/* Your custom content */}
</Button>
```

- **`Button`**: The main button component.

---

## About @lynx-js/lynx-ui

This component is a part of the `@lynx-js/lynx-ui` library, which is officially maintained by Lynx. As a **Headless** UI library long-term maintained by the Lynx team, we provide maximally flexible, universal and high-performance UI solutions.

## License

lynx-ui is Apache License 2.0 licensed.
