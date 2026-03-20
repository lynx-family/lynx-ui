# @lynx-js/lynx-ui-checkbox

A headless Checkbox component for Lynx. It supports controlled/uncontrolled checked state and indeterminate mode.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-checkbox`)_

## Usage

The `lynx-ui-checkbox` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Checkbox)

## Component Structure

The `Checkbox` component is composed of several specialized sub-components to give you full control over the layout and styling.

```tsx
<Checkbox>
  <CheckboxIndicator />
</Checkbox>
```

- **`Checkbox`**: The root container that manages the state and interactions.
- **`CheckboxIndicator`**: The visual indicator that shows the checked state.

---

## About @lynx-js/lynx-ui

This component is a part of the `@lynx-js/lynx-ui` library, which is officially maintained by Lynx. As a **Headless** UI library long-term maintained by the Lynx team, we provide maximally flexible, universal and high-performance UI solutions.

## License

lynx-ui is Apache License 2.0 licensed.
