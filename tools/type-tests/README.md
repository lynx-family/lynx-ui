# React type compatibility checks

After building the component packages, run:

```sh
pnpm check:react-types --react-types 18
pnpm check:react-types --react-types 19
```

CI runs both checks. Each creates a temporary npm environment with only
`@types/react@18.3.31` or `@types/react@19.2.18`, installs the component
packages' external dependencies from the workspace catalog, and copies the
current built declarations and example sources into it. No workspace symlinks
or source aliases are used. The compiler verifies that every loaded React
declaration comes from the selected environment.

The checks use strict TypeScript, `jsx: react-jsx`, and
`jsxImportSource: @lynx-js/react`. They generate TSX probes for callable component
exports from the aggregate package and every direct package. `components.tsx`
also checks public props, render-prop children, inferred events, nullable refs,
generic ViewPager data, and invalid props that must remain rejected.

All published example packages' TS/TSX sources are checked separately. Build
configuration and unit tests are excluded. `skipLibCheck: true` skips dependency
declarations while still checking every example source file.

For a complete dependency declaration check, run:

```sh
pnpm check:react-types --react-types 19 --full-declarations
```

This currently fails on upstream declarations: ReactLynx `0.123.1` re-exports
types removed in React 19 and has an optional API/index-signature conflict;
`@lynx-js/types@4.1.0` has intrinsic-element conflicts with React and an SVG type
argument error; `@lynx-js/gesture-runtime@2.1.1` references undeclared
`FiberElement`. These require fixes in
[lynx-stack](https://github.com/lynx-family/lynx-stack) and
[Lynx](https://github.com/lynx-family/lynx), followed by dependency updates and
verification with `--full-declarations`.

Tracking: [lynx-ui #398](https://github.com/lynx-family/lynx-ui/issues/398) and
[lynx-website #1738](https://github.com/lynx-family/lynx-website/issues/1738).
