# @lynx-js/lynx-ui-presence

A Presence component for Lynx. It animates elements entering and leaving the view tree.

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
<Presence show={isVisible}>
  {(status) => (
    <view className={status === 'entering' ? 'fade-in' : 'fade-out'}>
      {/* Your content */}
    </view>
  )}
</Presence>
```

- **`Presence`**: Controls mount/unmount with enter/exit animation states.

### Hooks

- **`usePresenceGroup`**: Manages presence for a list of items.
- **`useVisibilityFromPresence`**: Derives visibility from presence context.

---

## About @lynx-js/lynx-ui

This component is a part of the `@lynx-js/lynx-ui` library, which is officially maintained by Lynx. As a **Headless** UI library long-term maintained by the Lynx team, we provide maximally flexible, universal and high-performance UI solutions.

## License

lynx-ui is Apache License 2.0 licensed.
