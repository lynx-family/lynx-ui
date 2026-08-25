# L.U.N.A Design System

This Web/React app is the starting point for validating design-system token
mapping, theme customization, and generated UI output against LUNA semantic
tokens.

## Routes

The app uses React Router with `BrowserRouter`. Rsbuild serves `index.html` for
unknown development paths through `server.historyApiFallback`; production
hosting must apply the same fallback for client routes.

| Path | Status | Responsibility |
| --- | --- | --- |
| `/tokens` | Implemented | Compare the LUNA semantic token values from two themes. |
| `/themes` | Planned | Theme composition and customization work. |
| `/components` | Planned | Component-level design-system validation. |
| `/interop/:system` | Planned | External design-system mapping and conversion. |

Keep route components under `src/pages/`, route-level shared layouts under
`src/layouts/`, presentational components under `src/components/`, and source
token or mapping data under `src/data/`. Add a route only when its page is
ready to be rendered.

## Development

Start the Rsbuild development server from the repository root:

```bash
pnpm --filter @lynx-js/example-luna-design-system dev
```

Create a production build:

```bash
pnpm turbo build --filter @lynx-js/example-luna-design-system
```
