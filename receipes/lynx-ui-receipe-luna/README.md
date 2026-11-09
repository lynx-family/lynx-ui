# @lynx-js/lynx-ui-receipe-luna

Experimental layout recipes for ReactLynx, inspired by
[Radix Themes layouts](https://www.radix-ui.com/themes/docs/overview/layout).

## Installation

```bash
npm install @lynx-js/lynx-ui-receipe-luna
```

## Components

- `Box`: a plain view with shared spacing and sizing.
- `Flex`, `Row`, `Column`: flex layouts with alignment, wrapping, and gaps.
- `Grid`: native CSS grid with column and row counts or track lists.
- `Container`: a centered content region with a maximum width.
- `Section`: a section with vertical spacing.

Use a LUNA theme at the application boundary; these layout components inherit
the surrounding theme and add no content colors.

See [API reference](./docs/APIReference.mdx), [coding guide](./SKILL.md), and the
[layout example](../../apps/examples/ReceipeLuna/Basic/index.tsx).
This `0.0.x` entry is experimental and may change before a stable release.
