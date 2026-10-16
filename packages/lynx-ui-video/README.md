# @lynx-js/lynx-ui-video

Headless Video playback for ReactLynx, backed by the experimental Lynx `<video>`
element available on Android, iOS, and HarmonyOS from Lynx 4.1. The public
properties, methods, and events form a subset of VideoEngine, with matching
names, callback shapes, and millisecond time units.

## Installation

```bash
pnpm add @lynx-js/lynx-ui-video
```

The component is also exported from `@lynx-js/lynx-ui`.

## Component

`Video` owns the native player and optional poster. `VideoRef` provides playback
controls; consumers supply layout, styling, and controls through composition.

See the [interactive example](../../apps/examples/Video/Basic/index.tsx),
[API reference](./docs/APIReference.mdx), and [component guide](./SKILL.md).
