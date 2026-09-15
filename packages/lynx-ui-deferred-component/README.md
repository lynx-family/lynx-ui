# @lynx-js/lynx-ui-deferred-component

Deferred rendering for ReactLynx. `DeferredComponent` mounts a child after the first layout or a configurable frame delay, with optional placeholder content.

## Installation

Install through the main `@lynx-js/lynx-ui` package:

```bash
pnpm add @lynx-js/lynx-ui
```

The standalone package is also available as `@lynx-js/lynx-ui-deferred-component`.

## Component Structure

```tsx
import { DeferredComponent } from '@lynx-js/lynx-ui'

<DeferredComponent estimatedStyle={{ width: '100%', minHeight: '120px' }}>
  <text>Deferred content</text>
</DeferredComponent>
```

`DeferredComponent` is a single component with no sub-components.

## Documentation

- [Examples](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/DeferredComponent)
- [API reference](./docs/APIReference.mdx)
- [Component guide](./SKILL.md)

## About @lynx-js/lynx-ui

This component is part of `@lynx-js/lynx-ui`, a headless component library maintained by the Lynx team for ReactLynx.

## License

[Apache License 2.0](./LICENSE)
