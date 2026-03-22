# @lynx-js/lynx-ui-overlay

An Overlay component for ReactLynx. It renders content in a native overlay layer above the main view tree.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-overlay`)_

## Usage

`@lynx-js/lynx-ui-overlay` is an internal primitive used by higher-level components (for example, `@lynx-js/lynx-ui-dialog`, `@lynx-js/lynx-ui-popover`, and `@lynx-js/lynx-ui-sheet`) to render content above the normal view tree.

It is not expected to be consumed directly in application code, and its API may change without notice. If you need an overlay-based UI, prefer using `Dialog`, `Popover`, or `Sheet` from `@lynx-js/lynx-ui`.

- [Dialog examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Dialog)
- [Popover examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Popover)
- [Sheet examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Sheet)

## Component Structure

The `OverlayView` component is the main overlay container:

```tsx
<OverlayView>
  {children}
</OverlayView>
```

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
