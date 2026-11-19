# lynx-ui Luna Recipe SKILL

## Core capabilities

Compose product layouts using `Box`, `Flex`, `Row`, `Column`, `Grid`,
`Container`, and `Section`. These components wrap native `view` elements and
share spacing and sizing props. They inherit the host's LUNA theme.

`Button` styles the headless button, and `Switch` composes the
headless switch, track, and thumb. Use `Theme` to apply or change
a LUNA palette for a subtree. See the
[theme switching demo](../../apps/examples/ReceipeLuna/ThemedControls/index.tsx).

## AI coding guide

### Minimal usable example

```tsx
import { Box, Column, Row } from '@lynx-js/lynx-ui-receipe-luna'

<Column p='4' gap='3'>
  <Row align='center' justify='between' gap='2'>
    <text>Account</text>
    <text>Settings</text>
  </Row>
  <Box p='3'>
    <text>Your content</text>
  </Box>
</Column>
```

### Recommended prompt formula

"Build [screen or region] using Luna recipe layout components. Arrange
[content] as [row, column, or grid]. Use [spacing, alignment, sizes] and inherit
the application's LUNA theme."

## Use cases and best practices

- Use `Column` for vertical content and `Row` for horizontal content.
- Use `Flex` when direction needs to change or reverse.
- Use `Grid columns='2' gap='3'` for equal columns, or provide a supported
  native track list such as `columns='100px 1fr'`.
- Use `Container` for a centered maximum-width region and `Section` for
  vertical breathing room. `Section` sizes use 16, 32, and 64px of padding.
- String spacing steps `"0"` through `"9"` map to
  0, 4, 8, 12, 16, 24, 32, 40, 48, and 64px. Numeric values are literal pixels.
- Axis props override shorthand props; individual sides override axes.
  For example, `p='4' px='2' pl='1'` gives 16px top/bottom, 8px right, 4px left.
- Set application colors with semantic LUNA tokens in CSS. Import
  `@lynx-js/luna-styles/index.css` directly in a stylesheet using these tokens,
  and apply a theme class such as `luna-light` at the screen root.
- Keep text inside `text` elements. Use `Button` for text actions and
  `Switch` for toggles. For a different anatomy use the headless controls.
- Enable CSS selectors and CSS inheritance in the ReactLynx plugin. Apply
  the theme class with `Theme`, or on an existing ancestor for CSS-only styling.
- Pass native attributes and events through `viewProps`.
- `style` is applied last, allowing explicit overrides of generated props.
  Constant display defaults live in package CSS; import the public entry so
  bundlers include that stylesheet.

## FAQ

### Does this support every Radix Themes layout feature?

No. This initial API uses native views, scalar layout props, and supported
Lynx grid tracks. It does not implement HTML element polymorphism, `asChild`,
media-query breakpoint objects, or named grid areas. Compute changing layout
props in the application using its viewport information.

### Is a theme provider required?

Layout geometry works without a provider. For styled controls, import
`@lynx-js/luna-styles/index.css` in the application and apply a LUNA theme
class to an ancestor. `Theme` applies the class, can be nested, and supplies the same theme to
`useLunaColor` from `@lynx-js/luna-reactlynx`.

### Do Row and Column add extra views?

Each renders one `Flex` view. They fix the direction prop while retaining its
alignment, spacing, wrapping, and sizing options.

## Sub components

The layouts and themed controls are standalone components. The switch
provides its track and thumb internally.
