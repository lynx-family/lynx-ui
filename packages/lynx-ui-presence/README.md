# @lynx-js/lynx-ui-presence

A Presence component for ReactLynx. It animates elements entering and leaving the view tree.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-presence`)_

## Usage

`@lynx-js/lynx-ui-presence` is an internal primitive used by higher-level components (for example, `@lynx-js/lynx-ui-dialog`, `@lynx-js/lynx-ui-popover`, and `@lynx-js/lynx-ui-sheet`) to control mount/unmount with enter/exit animation states.

It is not expected to be consumed directly in application code, and its API may change without notice. If you need enter/exit animations for overlays and panels, prefer using `Dialog`, `Popover`, or `Sheet` from `@lynx-js/lynx-ui`.

- [Dialog examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Dialog)
- [Popover examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Popover)
- [Sheet examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Sheet)

## Component Structure

```tsx
<Presence>
</Presence>
```

- **`Presence`**: Controls mount/unmount with enter/exit animation states.
- **`usePresenceGroup`**: Hook for managing presence of a list of items.
- **`useVisibilityFromPresence`**: Hook for deriving visibility from presence context.

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless UI library officially maintained by the Lynx team, provided as a reference for building flexible, universal, and high-performance ReactLynx components.

## License

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) is [**Apache License 2.0**](./LICENSE) licensed.
