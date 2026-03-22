# @lynx-js/lynx-ui-radio-group

A headless RadioGroup component for ReactLynx. It manages single-selection state across a group of radio buttons.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-radio-group`)_

## Usage

The `lynx-ui-radio-group` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/RadioGroup)

## Component Structure

The `RadioGroup` component is composed of the following sub-components:

```tsx
<RadioGroupRoot>
  <Radio>
    <RadioIndicator />
  </Radio>
</RadioGroupRoot>
```

- **`RadioGroupRoot`**: The root container that manages the selection state.
- **`Radio`**: An individual radio button.
- **`RadioIndicator`**: The visual indicator for the selected state.

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
