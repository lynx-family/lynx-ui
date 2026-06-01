# Foundation

Read this file for setup and for deciding whether an issue belongs to lynx-ui.

## Official docs

- Index: `https://lynxjs.org/next/lynx-ui/`
- Introduction: `https://lynxjs.org/next/lynx-ui/introduction`

## Install and import

Prefer the aggregate package and public entry:

```bash
npm install @lynx-js/lynx-ui
```

```tsx
import { Button } from '@lynx-js/lynx-ui';
```

Use a component package only for an explicit package boundary:

```bash
npm install @lynx-js/lynx-ui-button
```

```tsx
import { Button } from '@lynx-js/lynx-ui-button';
```

## ReactLynx configuration

For usage that depends on gesture handling, verify the ReactLynx plugin configuration includes `enableNewGesture: true`:

```ts
export default defineConfig({
  plugins: [
    pluginReactLynx({
      enableNewGesture: true,
    }),
  ],
})
```

## Route follow-up

- Component selection: [`component-overview.md`](./component-overview.md)
- Luna themes and tokens: [`theming-and-tokens.md`](./theming-and-tokens.md)
- Animation choice: [`motion.md`](./motion.md)
- Common component combinations: [`component-composition.md`](./component-composition.md)

## Troubleshooting checklist

1. Confirm the application uses ReactLynx.
2. Confirm the intended package boundary.
3. Select the component through [`component-overview.md`](./component-overview.md).
4. Verify props and exports in the generated API reference.
5. Compare the implementation with the generated examples reference.
6. Inspect the theming or motion reference when relevant.

## Boundary handoff

- ReactLynx architecture, rendering behavior, thread model, or framework setup: use `reactlynx-best-practices`.
- TypeScript compiler, plugin, or project configuration: use `lynx-typescript`.
