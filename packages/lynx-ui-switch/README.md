# @lynx-js/lynx-ui-switch

A headless Switch (toggle) component for Lynx. It provides unstyled primitives for toggle states.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-switch`)_

## Usage

The `lynx-ui-switch` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Switch)

## Component Structure

The `Switch` component is composed of the following sub-components:

```tsx
<Switch>
  <SwitchTrack>
    <SwitchThumb />
  </SwitchTrack>
</Switch>
```

- **`Switch`**: The root container that manages the toggle state.
- **`SwitchTrack`**: The track/rail of the switch.
- **`SwitchThumb`**: The sliding thumb indicator.

---

## About @lynx-js/lynx-ui

This component is a part of the `@lynx-js/lynx-ui` library, which is officially maintained by Lynx. As a **Headless** UI library long-term maintained by the Lynx team, we provide maximally flexible, universal and high-performance UI solutions.

## License

lynx-ui is Apache License 2.0 licensed.
