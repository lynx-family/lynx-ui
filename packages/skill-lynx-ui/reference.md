# lynx-ui Component Routing

Use this file to choose the right lynx-ui component before reading component-level details.

This is the routing layer for the skill:

- `SKILL.md` tells the agent how to work
- `reference.md` tells the agent where to route the task
- `references/components/<component>/guide.md` tells the agent how to use the chosen component

## How to route

1. Start from the user's visible behavior, not from package names.
2. Prefer the most specific component that matches the interaction model.
3. Read that component's `guide.md` first.
4. Only open `api.md` when exact props, types, or exports need verification.
5. Only open examples when the guide is not enough.

## Routing Rules

### Use `Button`

- For custom interactive controls that need button behavior without built-in styling.
- Good fit for icon buttons, custom design-system buttons, and disabled press handling.
- Avoid when the interaction is selection, toggling, dragging, or text entry.
- Next file: `references/components/button/guide.md`

### Use `Dialog`

- For blocking, centered modal interactions that interrupt the current flow.
- Good fit for confirm dialogs, alerts, and overlay-backed modal content.
- Avoid when the UI is a bottom sheet or anchored floating panel.
- Next file: `references/components/dialog/guide.md`

### Use `FeedList`

- For feed-style collections with built-in refresh and load-more semantics.
- Good fit for timeline pages, stream content, or paginated feeds.
- Avoid when you only need a regular virtual list without feed behaviors.
- Next file: `references/components/feed-list/guide.md`

### Use `LazyComponent`

- For expensive content that should defer mounting until it becomes visible.
- Good fit for below-the-fold content and heavy list items.
- Avoid when the content is lightweight or always visible.
- Next file: `references/components/lazy-component/guide.md`

### Use `List`

- For repeated item collections where virtual scrolling is the primary need.
- Good fit for long lists, grids, or waterfall layouts.
- Avoid when you need feed-specific refresh or load-more behaviors; prefer `FeedList`.
- Next file: `references/components/list/guide.md`

### Use `Popover`

- For anchored floating content that appears relative to a trigger.
- Good fit for contextual menus, lightweight overlays, and anchored tips.
- Avoid when the content should interrupt the whole flow; prefer `Dialog`.
- Next file: `references/components/popover/guide.md`

### Use `ScrollView`

- For bounded scrolling regions with mixed or relatively small content trees.
- Good fit for generic vertical or horizontal scrolling containers.
- Avoid when the content is a large repeated collection; prefer `List` or `FeedList`.
- Next file: `references/components/scroll-view/guide.md`

### Use `Sheet`

- For composable bottom or side sheets with snap points, backdrop handling, and imperative ref control.
- Good fit for supplemental content that should expand, collapse, or close through sheet semantics.
- Avoid when you only need a centered dialog or an anchored popover.
- Next file: `references/components/sheet/guide.md`

### Use `Slider`

- For selecting a numeric value along a continuous or stepped track.
- Good fit for volume, progress, range-like settings, and custom slider visuals.
- Avoid when the user should select from discrete text options; use a purpose-built selection control instead.
- Next file: `references/components/slider/guide.md`

### Use `Swiper`

- For horizontal paging or carousel-style interactions.
- Good fit for banners, paged cards, looping carousels, and automatic playback content.
- Avoid when you only need free scrolling without page snapping.
- Next file: `references/components/swiper/guide.md`

## Coverage Notes

- This skill only routes components that have curated references bundled in this package.
- If the target component is missing, say so explicitly and fall back to repository sources instead of pretending the skill covers it.
- For the current bundled component list, see `references/index.md`.
