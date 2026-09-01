# @lynx-js/lynx-ui-toast

A Toast component for ReactLynx. It displays lightweight transient feedback messages.

## Installation

We strongly recommend installing and using this package through the main `@lynx-js/lynx-ui` package:

```bash
# pnpm (recommended)
pnpm add @lynx-js/lynx-ui

# npm
npm install @lynx-js/lynx-ui

# yarn
yarn add @lynx-js/lynx-ui
```

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-toast`)_

## Usage

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Toast)

## Component Structure

```tsx
<ToastRoot show={show}>
  <ToastPositioner>
    <ToastContent>{/* Your content */}</ToastContent>
  </ToastPositioner>
</ToastRoot>
```

## About @lynx-js/lynx-ui

This package is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
