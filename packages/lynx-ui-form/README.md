# @lynx-js/lynx-ui-form

A headless Form component for Lynx. It provides form context and a submit button that collects field values.

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
  <FormField name="username">
    <Input />
  </FormField>
  <FormSubmitButton />
</FormRoot>
```

- **`FormRoot`**: The root container that provides form context.
- **`FormField`**: Wraps an input and registers it with the form.
- **`FormSubmitButton`**: A button that triggers form submission.

---

## About @lynx-js/lynx-ui

This component is a part of the `@lynx-js/lynx-ui` library, which is officially maintained by Lynx. As a **Headless** UI library long-term maintained by the Lynx team, we provide maximally flexible, universal and high-performance UI solutions.

## License

lynx-ui is Apache License 2.0 licensed.
