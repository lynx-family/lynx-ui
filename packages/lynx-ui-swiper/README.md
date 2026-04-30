# @lynx-js/lynx-ui-swiper

A Swiper (carousel) component for ReactLynx. It provides pagination and gesture-handling primitives.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-swiper`)_

## Usage

The `lynx-ui-swiper` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Swiper)

## Component Structure

The `Swiper` component is composed of the following sub-components:

```tsx
<Swiper>
  {({ index }) => (
    <SwiperItem>
      {/* Your item content */}
    </SwiperItem>
  )}
</Swiper>
```

- **`Swiper`**: The main swiper container.
- **`SwiperItem`**: The individual swiper item.

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
