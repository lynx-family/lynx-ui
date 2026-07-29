---
"@lynx-js/luna-core": patch
---

Migrate luna-core from a shim package to a source-built package in lynx-ui.

The package now builds its artifacts from migrated source with Rslib instead of
syncing the upstream distribution. Public exports remain
unchanged.
