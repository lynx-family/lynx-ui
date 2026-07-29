---
"@lynx-js/luna-styles": patch
---

Migrate luna-styles from a shim package to a source-built CSS package in
lynx-ui.

The package now generates its CSS theme files from local LUNA tokens with Rslib
instead of syncing the upstream `@dugyu/luna-styles` distribution. Public CSS
exports remain unchanged.
