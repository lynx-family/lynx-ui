---
"@lynx-js/luna-tailwind": patch
---

Migrate luna-tailwind from a shim package to a source-built package in lynx-ui.

The package now builds its Tailwind preset from migrated source with Rslib
instead of syncing the upstream `@dugyu/luna-tailwind` distribution. Public
exports remain unchanged.
