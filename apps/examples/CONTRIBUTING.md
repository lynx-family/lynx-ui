# Example Authoring Guidelines

Examples are both runnable applications and source-code references. Keep each
entry focused on the component API and behavior that the example demonstrates.

## Structure

Place each example under `apps/examples/<Component>/<UseCase>/`:

```text
<UseCase>/
|-- data.ts
|-- index.css
`-- index.tsx
```

- Register every entry in the component package's `lynx.config.mjs`.
- Import public component APIs from `@lynx-js/lynx-ui` unless the symbol is
  intentionally unavailable from the aggregate package.
- Keep files used by only one entry inside that entry's directory.
- Put code shared by multiple entries under
  `apps/examples/<Component>/shared/`.

## Entry Source

Downstream documentation presents `index.tsx` as the example source, while the
published example package includes the other files in the entry directory.
Optimize `index.tsx` for understanding the demonstrated API:

- Keep component configuration, rendering, state, event handlers, and other
  behavior essential to the example in `index.tsx`.
- Move lengthy static fixtures and data-generation code to `data.ts`.
- Move a sizable presentational subtree to an adjacent, entry-local component
  when it would occupy more of `index.tsx` than the demonstrated API.
- Keep behavior that proves the example in `index.tsx`. Extract a card or row,
  but do not hide the relevant component composition, event handler, state, or
  imperative command merely to reduce line count.
- Do not hide core interaction logic in a helper merely to shorten the entry.
- Keep incidental implementation details out of the entry when they do not
  help explain the demonstrated behavior.

## Interactivity

- Keep the demonstrated behavior reachable when a renderer does not provide
  the example's primary gesture. For example, supplement swipe navigation with
  clickable page indicators or controls when a web preview cannot reproduce
  the native gesture.
- Use the appropriate headless control, such as `Button`, for clickable
  indicators, tabs, and actions instead of attaching tap handlers to
  presentational `view` or `text` nodes.
- Drive an imperative interaction from the control, then use the component's
  change event as the source of truth for the resulting state. Gesture and
  click paths must keep the same selected state.
- Do not add a second fallback when the example already exposes an equivalent
  control.
- Place persistent pagination controls only where the pager geometry keeps
  their position stable. Avoid indicators that move as a dynamic-height page
  transitions unless that movement is part of the demonstrated behavior.

## Class Names

Example entries are built independently, so they do not need a unique
component-and-use-case prefix on every class. They still need protection from
styles supplied by the website or application that hosts the example.

- Use `demo-container` on the example root. Use other established `demo-*`
  classes for host-facing layout surfaces when needed.
- Name the headless component nodes after their role, such as `view-pager`,
  `view-pager-item`, `switch`, `switch-track`, or `switch-thumb`.
- Use concise semantic names for entry-local supporting elements, such as
  `header`, `card`, `title`, `controls`, or `indicator`.
- Use concise state and variant classes, such as `active`, `disabled`,
  `card-primary`, or `page-neutral`.
- Avoid generic host-facing names such as `container`, which can collide with
  the embedding website.
- Keep dynamic class values in `data.ts` synchronized with their CSS
  selectors.

## Visual Economy

- Require every visible element to demonstrate content, expose component
  state, clarify a non-obvious interaction, or establish necessary visual
  structure.
- Remove component names and example titles when the primary stage already
  identifies itself through its content.
- Do not present the same state twice, such as with both an indicator and a
  counter, unless exact and relative position each serve a distinct task.
- Do not repeat a parent category, active tab, or item identifier inside every
  repeated child when the surrounding structure already provides that
  context.
- Prefer removing an ornamental element to inventing a rationale for it.

## Layout

- Treat the demonstrated component and its essential heading, status, or
  controls as one visual stage.
- Center a cover-oriented or single-component stage horizontally and
  vertically within the safe viewport. Do not anchor the primary content near
  the top merely by adding fixed padding.
- Give the primary component stable dimensions or responsive constraints so
  its visual weight remains balanced as content changes.
- Keep headings and controls subordinate to the primary component. They
  should support the stage rather than define its size or visual center.
- Let full-screen work surfaces, scrollable lists, and other spatial examples
  use the available area instead of forcing them into a centered card, while
  preserving platform navigation and safe-area boundaries.
- Inset a horizontal gesture surface from the viewport edge when it would
  otherwise capture an iOS edge-back gesture. Let the surrounding stage own
  that escape lane.
- When a component sets an inline width default, class-based width rules cannot
  override it. Use the component's `style` prop for an explicit size, or use
  ancestor padding when the surrounding stage should own the escape lane.
- Keep interaction insets and content padding independent. An outer gesture
  escape lane does not replace the inner spacing that gives content rhythm
  and keeps item edges clear of a clipped container.
- Leave enough inset for device safe-area overlays without shifting the whole
  stage visibly away from center.

## Typography

- Establish one dominant typographic or symbolic form. Supporting labels,
  instructions, and metadata must remain visibly subordinate.
- Identify the value that proves the example's behavior and make it the local
  typographic anchor. Page indices and labels should not compete with a
  changing measurement, amount, or state that the example exists to show.
- Give adjacent text elements a clear local hierarchy through a deliberate
  size and presence contrast. One line should provide the local visual anchor
  while the other recedes as supporting metadata.
- Evaluate hierarchy from a distance: the composition should read as a few
  large blocks before its smaller text becomes legible.
- Use `primary` selectively for symbolic, repeated, or pattern-like text when
  it visually connects a neutral surface to the surrounding signature
  gradient. Do not treat body copy as a brand accent.
- Prefer a small caption to a large generic page title when the component
  already supplies the primary visual.
- Relate small captions to an existing surface edge, rule, indicator, or other
  geometric detail. Do not add a decorative separator solely to support a
  caption.
- Remove explanatory copy that does not demonstrate behavior. Keep text-based
  fixtures only when their amount or shape is essential to the example.

## Styling

- Import `@lynx-js/luna-styles/index.css` directly from every stylesheet that
  references LUNA variables.
- Apply a LUNA theme class at the example root.
- Prefer semantic LUNA tokens over literal colors.
- Keep example copy brief, especially for cover-oriented entries. Explanatory
  text must not compete with the component or primary visual.
- Put styles shared by multiple entries under the component's `shared/`
  directory.
- Set `direction` on the outer container for RTL examples and let descendants
  inherit it.

## Gradient-First Composition

- In cover-oriented Lunaris examples, let the signature gradient define the
  surrounding environment instead of filling most of the viewport with
  `paper`, `canvas`, or `canvas-ambient`.
- Prefer the established local-range gradients for ordinary screens:
  `luna-gradient-rose` spans `gradient-a` to `gradient-b`,
  `luna-gradient-berry` and `luna-gradient-afterglow` span `gradient-b` to
  `gradient-c`, and `luna-gradient-ocean` spans `gradient-c` toward
  `gradient-d`.
- For a large transparent scene led by the primary accent, prefer the
  rose-to-berry range. The ocean range is a supporting, cool atmosphere and
  should not become the only large color field unless that role is intended.
- Match the color span to the physical span. A short viewport should normally
  transition between neighboring stops; crossing the full signature palette
  over a short distance reads as neon rather than atmospheric light.
- On a compact control or card, keep any gradient within one hue role, such as
  `primary` to `primary-2`.
- Reserve three or more signature stops for genuinely long content or stages
  where stretching keeps each locally visible transition gradual, such as a
  long ScrollView or a multi-page presentation.
- When a long stage needs multiple stops, extend their positions and repeat
  the dominant stop to create a sustained color field instead of distributing
  every hue evenly.
- Use `gradient-content`, `gradient-content-faded`, and
  `gradient-content-trace` for text and icons placed directly on a gradient.
  Do not use the mode-dependent `content` scale on a gradient surface.
- Keep direct-on-gradient controls and copy sparse. Prefer placing compact
  controls on an opaque `paper` or `canvas` surface, then use the matching
  `content` tokens inside that surface.
- Treat opaque `paper` and `canvas` regions as bounded physical objects within
  that environment. If a content surface must cover a large area, prefer a
  translucent `film` or `veil`, unless an intentional neutral band is part of
  the composition.
- Do not outline an opaque `paper` or `canvas` object on a gradient by
  default. Its fill contrast already defines the edge; an extra border often
  belongs to neutral-on-neutral surface stacking instead.
- Keep an outline when it carries structure: defining a transparent item,
  clarifying the boundary of a `film` or `veil`, or representing focus.
- Treat a divider separately from an outline. Use `rule` to separate adjacent
  pages or regions without drawing a border around each surface.
- Use `paper-film` or `paper-veil` for a single continuous stage when the
  gradient should remain perceptible through its content surface. Pair it with
  `gradient-content-trace` boundaries and the gradient foreground scale so
  the result adapts coherently between dark and light themes.
- Evaluate repeated surfaces as a group. A long list or dense grid of opaque
  cards can merge perceptually into one page-sized neutral field. Do not
  scatter `film` or `veil` across many small items as a substitute; prefer
  transparent items with `gradient-content` outlines, or add more atmospheric
  spacing.

## Main Thread Scripts

- Keep a main-thread handler in `index.tsx` when it demonstrates a core
  component capability.
- Do not move a main-thread function to another module solely to reduce the
  displayed source length.
- When a main-thread handler captures imported data, inspect the generated
  worklet closure and verify the behavior in LynxExplorer or on a device.
- A successful bundle build does not replace Native runtime verification.

## Validation

After modifying an example:

```bash
pnpm check:luna-vars
pnpm turbo build
```

Also run the relevant formatter and linter checks. For Native behavior,
main-thread scripts, gestures, layout, or animation, run the affected entry in
LynxExplorer or on a device and verify the actual interaction.
