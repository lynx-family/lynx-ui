# Lynx UI Storybook

Interactive component documentation for `@lynx-js/lynx-ui` built with [storybook-lynx-rsbuild](https://github.com/lynx-community/storybook-lynx).

## Getting Started

```bash
# From repository root
pnpm install

# Run Storybook dev (builds Lynx bundles + starts Storybook)
cd apps/storybook
pnpm dev
```

This runs two processes concurrently:
1. `rspeedy build --watch --environment web` — watches and rebuilds Lynx component bundles
2. `storybook dev -p 6006` — starts the Storybook UI at http://localhost:6006

## Architecture

```
apps/storybook/
├── .storybook/
│   └── main.ts          # Storybook config (uses storybook-lynx-rsbuild)
├── lynx.config.ts       # Rspeedy config — defines entry points for each component
├── src/
│   ├── lynx/            # ReactLynx component wrappers (run inside <lynx-view>)
│   │   ├── Button.tsx   # Reads args via useInitData(), renders <Button>
│   │   ├── Switch.tsx
│   │   └── ...
│   └── stories/         # CSF stories (run in browser)
│       ├── Button.stories.ts
│       ├── Switch.stories.ts
│       └── ...
└── dist/lynx/           # Built bundles (auto-generated)
```

### How it works

- **Storybook manager + controls** run in the browser as usual
- **Stories render inside `<lynx-view>`** — a custom element powered by the Lynx Web runtime
- **Args** are passed from Storybook to Lynx via `initData` (must be JSON-serializable)
- **Actions** (like onClick) are bridged via `NativeModules.bridge.call('STORYBOOK_ACTION', ...)`

## Components Covered

### Basic
- **Button** — disabled, variant (primary/secondary/outline)
- **Switch** — checked, disabled
- **Checkbox** — checked, disabled, indeterminate
- **RadioGroup** — value, disabled, options
- **Slider** — value, step, disabled, RTL

### Form
- **Input** — type, placeholder, maxLength, readonly, confirmType
- **TextArea** — placeholder, maxLines, readonly
- **Form** — validation display

### Overlay
- **Dialog** — show, clickToClose, overlayLevel
- **Popover** — show, placement, placementOffset
- **Sheet** — show, side, snapPoints, enableDragToClose
- **Overlay** — visible, overlayLevel

### Animation
- **Presence** — show/hide with enter/exit animation

### Scrollable
- **ScrollView** — orientation, bounce, enableScroll
- **List** — single/flow/waterfall, spanCount, gaps
- **Swiper** — loop, autoPlay, duration

### Gesture
- **Draggable** — direction, resetOnEnd, trigger
- **Sortable** — enableSorting
- **SwipeAction** — enableSwipe

## Adding a New Story

1. Create a Lynx wrapper in `src/lynx/YourComponent.tsx`:
   ```tsx
   import { root, useInitData } from '@lynx-js/react';
   import { YourComponent } from '@lynx-js/lynx-ui-your-component';

   function App() {
     const args = useInitData() as YourArgs;
     return <YourComponent {...args} />;
   }
   root.render(<App />);
   ```

2. Add entry to `lynx.config.ts`:
   ```ts
   source: { entry: { 'your-component': './src/lynx/YourComponent.tsx' } }
   ```

3. Create story in `src/stories/YourComponent.stories.ts`:
   ```ts
   import type { Meta, StoryObj } from 'storybook-lynx-rsbuild';
   import { createLynxView } from 'storybook-lynx-rsbuild';

   type Args = { /* ... */ };
   const meta = {
     title: 'Category/YourComponent',
     render: (args, ctx) => createLynxView({
       args, bundleUrl: './lynx/your-component.web.bundle', canvasElement: ctx.canvasElement
     }),
     argTypes: { /* controls */ },
     args: { /* defaults */ },
   } satisfies Meta<Args>;
   export default meta;
   export const Default: StoryObj<Args> = {};
   ```

## Requirements

- Node.js ≥22.13.0 or ≥24.x
- pnpm (via Corepack)
- Storybook 10.5+
