# lynx-ui recipes

This workspace contains opinionated component entries for product and design
systems, including themed components and composed layouts. Keep reusable
headless primitives in `packages/` and shared theme foundations in `luna/`.

The initial experimental entry is
[`lynx-ui-receipe-luna`](./lynx-ui-receipe-luna/README.md): Radix-inspired
layouts, a theme scope, and styled Button and Switch components.

Each recipe owns its public composition, styles, and entry point. Depend on
the specific headless packages for behavior and the design system for tokens,
so future DUX or GenUI entries can follow the same structure and choose their
own theme contract. Keep runnable consumers in `apps/examples/`.

Scaffold another entry with
`pnpm make-new-component --create receipe-<name> --recipe`, then update its
manifest, public exports, documentation, examples, and changesets.
