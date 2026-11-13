# lynx-ui-toast SKILL

## What It Is

`lynx-ui-toast` is a headless transient-notification primitive for ReactLynx. It supports controlled and imperative usage, custom enter and leave styling, overlay positioning, and swipe-to-dismiss motion.

## Building Blocks

- **`ToastRoot`**: Owns controlled visibility and presence state.
- **`ToastPositioner`**: Places the toast in an overlay container without blocking interaction outside the toast.
- **`ToastContent`**: Renders toast content and optionally applies the built-in slide animation.
- **`ToastDraggableContent`**: Adds main-thread swipe tracking for gesture-responsive dismissal.
- **`ToastMountPoint`** and **`toast.open`**: Provide an imperative, app-level toast entry point.

## Usage Rules

- Compose `ToastPositioner` and one content component inside `ToastRoot` for controlled usage.
- Keep the `show` value in sync from `onOpen` and `onClose` when using controlled state.
- Use `ToastContent` for ordinary transient messages and `ToastDraggableContent` only when swipe dismissal is needed.
- Set `useDefaultAnimation={false}` when CSS classes should own the enter and leave animation.
- Mount one `ToastMountPoint` when using `toast.open`; the imperative API targets the active mount point.
- Keep business logic in normal background-thread callbacks. The draggable implementation already confines gesture-coupled visual work to main-thread handlers.

## Verification

- Run `pnpm --filter @lynx-js/lynx-ui-toast build` after implementation or type changes.
- Run `pnpm --filter @lynx-example/lynx-ui-toast build` after example changes.
- Run `pnpm check:exports` when changing public or aggregate exports.
- Validate both controlled and imperative examples when changing presence or mount-point behavior.
