# L.U.N.A Lynx Showcase

This ReactLynx app provides the source-built preview payload used by the L.U.N.A
Stage and Studio showcases in lynx-ui.

## How to Explore

From the repository root, build the app and its workspace dependencies:

```bash
pnpm turbo build --filter @lynx-js/example-luna-showcase-lynx
```

Start the development server:

```bash
pnpm --filter @lynx-js/example-luna-showcase-lynx dev
```

### LynxExplorer App

To view the showcases on a mobile device, install the LynxExplorer App:

- [Android](https://github.com/lynx-family/lynx/releases/latest): official
  Lynx Android release from GitHub Releases
- [iOS](https://apps.apple.com/ca/app/lynx-go-dev-explorer/id6743227790):
  community build available on the App Store

Make sure the computer and mobile device are on the same network, then scan the
QR code printed in the terminal.

### Switch Showcase Entries

Press `r` in the terminal to open the entry switcher. Use the up and down arrow
keys to navigate between entries, then press `Enter` to load the selected
showcase.
