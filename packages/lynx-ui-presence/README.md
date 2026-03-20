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

The `lynx-ui-presence` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Presence)

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
