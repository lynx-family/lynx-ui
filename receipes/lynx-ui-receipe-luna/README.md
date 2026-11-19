# @lynx-js/lynx-ui-receipe-luna

Experimental layouts and themed controls for ReactLynx. The layouts are inspired by
[Radix Themes layouts](https://www.radix-ui.com/themes/docs/overview/layout).

## Installation

```bash
npm install @lynx-js/lynx-ui-receipe-luna @lynx-js/luna-styles
```

## Components

- `Box`: a plain view with shared spacing and sizing.
- `Flex`, `Row`, `Column`: flex layouts with alignment, wrapping, and gaps.
- `Grid`: native CSS grid with column and row counts or track lists.
- `Container`: a centered content region with a maximum width.
- `Section`: a section with vertical spacing.
- `Theme`: scopes a LUNA palette to a subtree.
- `Button`: a text action with solid and soft treatments.
- `Switch`: a toggle with a styled track and thumb.

## Usage

Enable `enableCSSSelector` and `enableCSSInheritance` in the ReactLynx plugin
for state selectors and scoped LUNA tokens. Import the LUNA stylesheet in your
app, then apply a theme key at your app or screen boundary:

```tsx
import '@lynx-js/luna-styles/index.css'
import {
  Column,
  Button,
  Switch,
  Theme,
  Row,
} from '@lynx-js/lynx-ui-receipe-luna'

function Settings({ onSave }: { onSave: () => void }) {
  return (
    <Theme themeKey='lunaris-dark'>
      <Column p='4' gap='3'>
        <Row align='center' justify='between'>
          <text className='settings-label'>Product updates</text>
          <Switch accessibility-label='Product updates' defaultChecked />
        </Row>
        <Row justify='end'>
          <Button onClick={onSave}>Save changes</Button>
        </Row>
      </Column>
    </Theme>
  )
}
```

In your app stylesheet, set `.settings-label { color: var(--content); }`.

Use `lunaris-dark`, `lunaris-light`, `luna-dark`, or `luna-light`.
You can also wrap a region in a nested scope, or apply the same theme class
to a view you already own for CSS-only styling. `Theme` applies the CSS class
and supplies its matching values to `useLunaColor` from
`@lynx-js/luna-reactlynx`. Interactive controls keep their state across theme
changes. Layout geometry works on its own.

See [API reference](./docs/APIReference.mdx), [coding guide](./SKILL.md), and the
[layout](../../apps/examples/ReceipeLuna/Basic/index.tsx) and
[theme switching](../../apps/examples/ReceipeLuna/ThemedControls/index.tsx)
examples.
This entry is experimental and its API may change.
