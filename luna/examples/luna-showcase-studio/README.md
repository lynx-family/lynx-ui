# L.U.N.A Studio Showcase

This Web/React app provides the runnable Studio showcase for the L.U.N.A Stage
and Studio integration in lynx-ui. It consumes the workspace
`@lynx-js/luna-studio` and `@lynx-js/luna-stage` packages and loads the built
`@lynx-js/example-luna-showcase-lynx` output as its preview content.

## How to Explore

From this example directory, build the showcase and its workspace dependencies,
then preview the production build:

```bash
pnpm demo
```

Or run the same command from the repository root:

```bash
pnpm --filter @lynx-js/example-luna-showcase-studio demo
```

To iterate on the Studio UI after building the Lynx showcase payload, start the
development server from this example directory:

```bash
pnpm dev
```

Or start it from the repository root:

```bash
pnpm --filter @lynx-js/example-luna-showcase-studio dev
```

The development server does not rebuild the Lynx showcase automatically. Run
the filtered Turbo build again after changing the Lynx preview content.
