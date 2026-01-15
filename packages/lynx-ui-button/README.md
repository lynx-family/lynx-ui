# @lynx-js/lynx-ui

`@lynx-js/lynx-ui` is the component library officially maintained by Lynx. As a **Headless** UI library long-term maintained by the Lynx team, we provide maximally flexible, universal and high-performance UI solutions.

## Introduction

We aim to complement native components' adaptation capabilities through frontend components, building a high-performance, native-like Lynx component ecosystem with excellent compatibility.

UI characteristics within the same platform often exhibit significant differences in behavior, APIs, and even design philosophies—especially for advanced features. Cross-platform frameworks must strive to reconcile these discrepancies, and Lynx is no exception.

Frontend components will organize and standardize these numerous underlying atomic APIs, reconciling their behaviors and limitations to achieve ultimate consistency on the frontend layer.

## Installation

`lynx-ui` supports both full-library imports and individual component imports.

### Option 1: Full-Library Import (Recommended)

You can import the entire `lynx-ui` package. `lynx-ui` supports tree-shaking, so unused components won't increase your final build size.

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

Each `lynx-ui` component is published as a separate package. This method is available for compatibility or specific use cases.

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

If you are using `rspeedy`, you might need to configure the `pluginReactLynx`.

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

- **LynxSDK**: > 2.16

> These are full-library requirements. Individual components may have lower version requirements.

## Development

If you are interested in contributing to `lynx-ui`, please read our [Contributing Guide](./CONTRIBUTING.md).

## License

[Apache-2.0](./LICENSE)
