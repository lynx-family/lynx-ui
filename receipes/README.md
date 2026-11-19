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
own token vocabulary. Import a recipe explicitly from its own package. Keep
runnable consumers in `apps/examples/`.

Resolve one theme per scope for CSS and JavaScript. Define layout constraints
on the layout and style component parts on the nodes that the component owns.
Use the primitive's `ui-*` classes for interaction state. Document slot defaults
and fixed constraints as part of the recipe API.

Give each component its own folder under the recipe's `src/`, with its
implementation and any component-specific stylesheet together. Put helpers
used by multiple components in `src/shared/`.

Scaffold another entry with
`pnpm make-new-component --create receipe-<name> --recipe`, then update its
manifest, public exports, documentation, examples, and changesets.
