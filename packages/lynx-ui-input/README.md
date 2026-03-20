# @lynx-js/lynx-ui-input

A headless Input component for ReactLynx. It provides primitives for text entry and keyboard awareness.

## Requirements

- **Lynx SDK**: >= 3.4

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-input`)_

## Usage

The `lynx-ui-input` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Input)

## Component Structure

The `Input` component is composed of several specialized sub-components to give you full control over the layout and styling.

```tsx
<KeyboardAwareRoot>
  <KeyboardAwareResponder>
    <KeyboardAwareTrigger>
      <Input />
    </KeyboardAwareTrigger>
    <KeyboardAwareTrigger>
      <TextArea />
    </KeyboardAwareTrigger>
  </KeyboardAwareResponder>
</KeyboardAwareRoot>
```

- **`Input`**: The main input field.
- **`TextArea`**: A multi-line text input field.
- **`KeyboardAwareRoot`**: The root container for keyboard awareness.
- **`KeyboardAwareTrigger`**: The trigger area for the keyboard.
- **`KeyboardAwareResponder`**: The area that responds to the keyboard.

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
