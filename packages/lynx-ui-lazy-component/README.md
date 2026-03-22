# @lynx-js/lynx-ui-lazy-component

A LazyComponent for ReactLynx. It defers the loading of non-critical UI elements.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-lazy-component`)_

## Usage

The `lynx-ui-lazy-component` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/LazyComponent)

## Component Structure

The `LazyComponent` component is composed of the following sub-components:

```tsx
<LazyComponent>
  {/* Your content */}
</LazyComponent>
```

- **`LazyComponent`**: The main lazy loading component.

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
