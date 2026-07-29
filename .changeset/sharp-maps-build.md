---
"@lynx-js/luna-tokens": patch
---

Migrate luna-tokens from a shim package to a source-built package in lynx-ui.

The package now builds its token artifacts from migrated source with Rslib
instead of syncing the upstream `@dugyu/luna-tokens` distribution. Public
exports remain unchanged.
