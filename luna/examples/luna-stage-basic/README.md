# luna-stage Basic Example

This Web/React app demonstrates the basic `@lynx-js/luna-stage` experience by
rendering Lynx Web bundles in device frames. Its gallery also provides a shared
place to review the Web rendering of entries from `apps/examples/`, including
layout, theming, clipping, and responsive behavior.

## Development

From this directory, build the stage and every example package declared in its
`turbo.json`:

```bash
pnpm turbo build
```

Start the development server:

```bash
pnpm dev
```

When iterating on an entry from `apps/examples/`, rerun the local Turbo build:

```bash
pnpm turbo build
```

The local `turbo.json` builds the declared example package dependencies, and
the development server watches their generated `.web.bundle` outputs.

## Registering Examples

The gallery entries are declared in `src/demos/data.ts`. Each entry name must
match a key from the component example package's `lynx.config.mjs`.

When adding an example package to the stage, keep these files aligned:

- `package.json`: add the example package as a workspace development
  dependency.
- `rsbuild.config.ts`: expose the package's `dist` directory as a public
  source.
- `turbo.json`: keep the `@lynx-js/luna-stage#build` dependency and declare
  the example package build dependency.
- `src/demos/data.ts`: register the entries to render.
- `public/**`: keep local asset inputs aligned with the Turbo build inputs.

## Validation Scope

Use this stage for Web rendering and visual comparison across examples. It
does not replace LynxExplorer or device validation for Native rendering,
main-thread scripts, gestures, layout, or animation.
