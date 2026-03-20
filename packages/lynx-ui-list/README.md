# @lynx-js/lynx-ui-list

A virtualized List component for Lynx. Designed to render long lists of data.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-list`)_

## Usage

The `lynx-ui-list` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/List)

## Component Structure

The `List` component uses a render-prop pattern for items:

```tsx
<List
  data={items}
  renderItem={({ item }) => (
    <view>{/* Your item content */}</view>
  )}
/>
```

- **`List`**: The virtualized list container. Uses `renderItem` prop for item rendering.

---

## About @lynx-js/lynx-ui

This component is a part of the `@lynx-js/lynx-ui` library, which is officially maintained by Lynx. As a **Headless** UI library long-term maintained by the Lynx team, we provide maximally flexible, universal and high-performance UI solutions.

## License

lynx-ui is Apache License 2.0 licensed.
