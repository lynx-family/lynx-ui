# @lynx-js/lynx-ui

`@lynx-js/lynx-ui` is the official headless UI library for Lynx, built for maximum flexibility, universality, and performance.

> **Status**: Public repository · npm release pending
>
> This repository is public as part of our upstream preparation and documentation process.
> The @lynx-js/lynx-ui package has not been published to the public npm registry yet.
>
> As a result, installing via pnpm add @lynx-js/lynx-ui will return 404.
> This is expected. npm packages will be released at the official launch.

## Introduction

We extend native components' capabilities through frontend components, building a high-performance, native-like Lynx component ecosystem with broad compatibility.

UI characteristics on the same platform often differ in behavior, APIs, and even design philosophy, especially for advanced features. Cross-platform frameworks must bridge these gaps, and Lynx is no exception.

This is where lynx-ui comes in. By streamlining and unifying disparate atomic APIs, its frontend components reconcile underlying behaviors and limitations to deliver a consistent experience across platforms.

## Installation

`lynx-ui` supports both full-library imports and individual component imports.

### Option 1: Full-Library Import (Recommended)

Import the entire `lynx-ui` package. Tree-shaking is supported, so unused components won't increase your final build size.

```bash
pnpm add @lynx-js/lynx-ui
```

**Usage:**

```tsx
import { Button } from '@lynx-js/lynx-ui'

export default function App() {
  return (
    <view>
      <Button>Hello</Button>
    </view>
  )
}
```

### Option 2: Importing Individual Components

Each `lynx-ui` component is distributed as a separate package. Use this approach for compatibility or specific requirements.

**Example with `<Button>`:**

```bash
pnpm add @lynx-js/lynx-ui-button
```

**Usage:**

```tsx
import { Button } from '@lynx-js/lynx-ui-button'

export default function App() {
  return (
    <view>
      <Button>Hello</Button>
    </view>
  )
}
```

## Configuration

If you are using `rspeedy`, configure the `pluginReactLynx` as follows:

```typescript
// lynx.config.ts
import { defineConfig } from '@lynx-js/rspeedy'

export default defineConfig({
  plugins: [
    pluginReactLynx({
      targetSdkVersion: '2.14',
      enableNewGesture: true,
    }),
  ],
})
```

## Compatibility

- **LynxSDK**: >= 3.2

> These are full-library requirements. Individual components may have different version requirements.

## Development

If you are interested in contributing to `lynx-ui`, please read our [Contributing Guide](./CONTRIBUTING.md).

## License

[Apache-2.0](./LICENSE)
