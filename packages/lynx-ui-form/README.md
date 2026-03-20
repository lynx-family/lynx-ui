# @lynx-js/lynx-ui-form

A headless Form component for ReactLynx. It provides form context and a submit button that collects field values.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-form`)_

## Usage

The `lynx-ui-form` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Form)

## Component Structure

The `Form` component is composed of the following sub-components:

```tsx
<FormRoot>
  <FormField />
  <FormSubmitButton />
</FormRoot>
```

- **`FormRoot`**: The root container that provides form context.
- **`FormField`**: A form field container.
- **`FormSubmitButton`**: A button that triggers form submission.

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
