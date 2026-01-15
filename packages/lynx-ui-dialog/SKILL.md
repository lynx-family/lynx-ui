# Lynx UI Dialog SKILL

`Dialog` is a dialog component, used to display important information or require user interaction, interrupting the current workflow. `lynx-ui-dialog` is a composite component built on `primitives`, offering high flexibility and customizability.

## 1. Core Capabilities

- **Composite Component Structure**: Composed of `DialogRoot`, `DialogView`, `DialogBackdrop`, `DialogContent`, `DialogTrigger`, and `DialogClose`, allowing for free assembly of the dialog's structure.
- **Controlled and Uncontrolled Modes**: Supports being fully controlled by the parent component (`show` + `onShowChange`) or managing its own state (`defaultShow`).
- **High-performance Rendering**: `DialogView` can render content into a high-performance native overlay layer via the `container` prop, preventing the main document from being affected.
- **Customizable Animations**: Supports custom enter and exit animations via the `transition` property and CSS classes (`ui-entering`, `ui-leaving`).
- **Accessibility**: Built-in handling for keyboard interactions and focus management.

## 2. AI Coding Guide

### Minimal Usable Example

#### Uncontrolled Mode

```tsx
import {
  DialogRoot,
  DialogView,
  DialogBackdrop,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@lynx-js/lynx-ui-dialog'

function UncontrolledDialog() {
  return (
    <DialogRoot>
      <DialogTrigger>
        <button>Open Dialog</button>
      </DialogTrigger>
      <DialogView>
        <DialogBackdrop />
        <DialogContent>
          <text>This is a dialog.</text>
          <DialogClose>
            <button>Close</button>
          </DialogClose>
        </DialogContent>
      </DialogView>
    </DialogRoot>
  )
}
```

### Recommended Prompt Formula

> **Mode (Controlled/Uncontrolled)** + **Content and Structure** + **Interaction Logic (e.g., closing, confirmation)**

**Example Prompt:**

- "Create an uncontrolled `Dialog`. Clicking a trigger button opens it, and clicking a close button inside the dialog or the backdrop closes it."
- "Implement a controlled `Dialog` for a confirmation box. It contains a title, content, and two buttons, ‘Cancel’ and ‘Confirm’. The dialog is controlled by a `useState` variable."
- "Customize the enter and exit animations of the `Dialog` to be a fade-in/fade-out effect."

<!-- Removed pitfalls; converted into FAQ to match FeedList structure -->

## 3. Use Cases & Best Practices

### Uncontrolled Dialog

Simple to use, with the component managing its own state.

```tsx
import { DialogRoot, ... } from '@lynx-js/lynx-ui-dialog';

function UncontrolledDialogExample() {
  return (
    <DialogRoot>
      <DialogTrigger>Open</DialogTrigger>
      <DialogView>
        <DialogBackdrop clickToClose />
        <DialogContent>
          {/* ... Dialog Content ... */}
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </DialogView>
    </DialogRoot>
  );
}
```

**Example Path**: `apps/examples/src/Dialog/Uncontrolled/index.tsx`

### Controlled Confirmation Dialog

Suitable for scenarios that require interaction with external business logic, such as confirmation boxes.

```tsx
import { useState } from '@lynx-js/react';
import { DialogRoot, ... } from '@lynx-js/lynx-ui-dialog';

function ControlledConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    // business logic
    setIsOpen(false);
  };

  return (
    <view>
      <button onClick={() => setIsOpen(true)}>Delete</button>
      <DialogRoot show={isOpen} onShowChange={setIsOpen}>
        <DialogView>
          <DialogBackdrop />
          <DialogContent>
            <text>Are you sure?</text>
            <DialogClose>Cancel</DialogClose>
            <button onClick={handleConfirm}>Confirm</button>
          </DialogContent>
        </DialogView>
      </DialogRoot>
    </view>
  );
}
```

**Example Path**: `apps/examples/src/Dialog/Controlled/index.tsx`

## 4. FAQ

**Q: Why doesn’t the dialog open/close when I set `show`?**

A: In controlled mode, `DialogRoot` does not mutate state internally. Provide `onShowChange` and update the external `show` state in that callback.

**Q: The dialog appears but is covered by other elements. How do I make it visible?**

A: Use `container` and `overlayLevel` on `DialogView` to render into a higher native overlay layer, for example `container="window" overlayLevel={2}`.

**Q: Can I use `show` and `defaultShow` at the same time?**

A: No. Choose one mode only. Mixing controlled and uncontrolled props will cause incorrect behavior.

**Q: How should I set `z-index` for the `Dialog` to avoid stacking issues?**

A: Due to `DialogView` defaulting to `position: fixed`, and because of stacking context limitations, if you need to set `z-index` for the Dialog, you should set it on the `DialogView` layer, at the same level as `position: fixed`. Otherwise, layer stacking issues may occur.

```tsx
<DialogView container='window' style={{ zIndex: 2000 }}>
  {/* ... */}
</DialogView>
```

## 5. Sub components

- **`DialogRoot`**: The root component, manages the open/close state.
- **`DialogTrigger`**: A clickable element to open the `Dialog`.
- **`DialogView`**: The rendering container for the dialog, can be placed in a native overlay layer.
- **`DialogContent`**: The container for the main content of the `Dialog`.
- **`DialogBackdrop`**: The background mask layer.
- **`DialogClose`**: A clickable element to close the `Dialog`.

<!-- Removed the "More Examples" section to align with FeedList structure -->
