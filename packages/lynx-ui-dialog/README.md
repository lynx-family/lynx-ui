# @lynx-js/lynx-ui-dialog

A headless Dialog (modal) component for Lynx. It provides backdrop overlay, open/close state management, and enter/exit animations via Presence.

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

_(If necessary, you can still install the standalone package via `pnpm add @lynx-js/lynx-ui-dialog`)_

## Usage

The `lynx-ui-dialog` follows a headless composition pattern.

[View Full Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Dialog)

## Component Structure

The `Dialog` component is composed of several specialized sub-components to give you full control over the layout and styling.

```tsx
<DialogRoot>
  <DialogTrigger />
  <DialogView>
    <DialogBackdrop />
    <DialogContent>
      <DialogClose />
      {/* Your custom content */}
    </DialogContent>
  </DialogView>
</DialogRoot>
```

- **`DialogRoot`**: The root container that manages the state.
- **`DialogView`**: The viewport container for the dialog components.
- **`DialogBackdrop`**: The dimmed overlay behind the dialog.
- **`DialogContent`**: The actual dialog panel that contains your content.
- **`DialogTrigger`**: A button that opens the dialog.
- **`DialogClose`**: A button that closes the dialog.

---

## About @lynx-js/lynx-ui

This component is a part of the `@lynx-js/lynx-ui` library, which is officially maintained by Lynx. As a **Headless** UI library long-term maintained by the Lynx team, we provide maximally flexible, universal and high-performance UI solutions.

## License

lynx-ui is Apache License 2.0 licensed.
