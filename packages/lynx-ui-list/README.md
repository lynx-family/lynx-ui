# @lynx-js/lynx-ui-list

A virtualized List component for ReactLynx. Designed to render long lists of data.

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

```tsx
<List>
  {items.map((item) => (
    <list-item item-key={item.id} key={item.id}>
      <view>{/* Your item content */}</view>
    </list-item>
  ))}
</List>
```

- **`List`**: The virtualized list container.

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
