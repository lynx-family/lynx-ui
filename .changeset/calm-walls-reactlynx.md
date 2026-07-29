---
"@lynx-js/luna-reactlynx": patch
---

Migrate luna-reactlynx from a shim package to a source-built package in
lynx-ui.

The package now builds its ReactLynx theming and runtime primitives from
migrated source with Rslib instead of syncing the upstream
distribution. Public exports remain unchanged.
