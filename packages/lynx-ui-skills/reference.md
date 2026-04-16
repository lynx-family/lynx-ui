# lynx-ui Component Routing

Use this file to choose the right lynx-ui component before reading component-level details.

This is the routing layer for the skill:

- `SKILL.md` tells the agent how to work
- `reference.md` tells the agent where to route the task
- `references/components/<component>/guide.md` tells the agent how to use the chosen component

## How to route

1. Start from the user’s visible behavior, not from package names.
2. Prefer the most specific component that matches the interaction model.
3. Read that component’s `guide.md` first.
4. Only open `api.md` when exact props, types, or exports need verification.
5. Only open examples when the guide is not enough.

## Routing Rules

### Use `Button`

- For explicit tap targets or action controls.
- Good fit for buttons, icon buttons, action chips, or interactive controls.
- Avoid when the node is only layout or static text.
- Next file: `references/components/button/guide.md`

### Use `Dialog`

- For blocking, centered modal interactions that interrupt the current flow.
- Good fit for confirm/cancel prompts, alerts, and focused modal content.
- Avoid when the UI is a bottom sheet or partial-height panel.
- Next file: `references/components/dialog/guide.md`

### Use `FeedList`

- For data feeds with refresh/load-more semantics.
- Good fit for long feeds, stream-like content, or list UIs that imply pagination.
- Avoid when the content is small, static, or not really a feed.
- Next file: `references/components/feed-list/guide.md`

### Use `LazyComponent`

- For expensive content that should defer mounting or rendering.
- Good fit for below-the-fold or exposure-triggered heavy UI.
- Avoid when the content is lightweight or always visible.
- Next file: `references/components/lazy-component/guide.md`

### Use `List`

- For repeated item collections where the primary pattern is rows or cards.
- Good fit for long or medium-length repeated data, especially when item rendering is the main concern.
- Avoid when the content is heterogeneous and mostly static.
- Next file: `references/components/list/guide.md`

### Use `Popover`

- For anchored floating content attached to a trigger or anchor.
- Good fit for menus, tooltips-with-content, lightweight overlays, and floating panels.
- Avoid when the content is blocking like a modal, or when it should slide from the bottom.
- Next file: `references/components/popover/guide.md`

### Use `ScrollView`

- For bounded scrolling regions with mixed content.
- Good fit for small or heterogeneous scrollable content trees.
- Avoid when the content is primarily a repeated collection; prefer `List` or `FeedList`.
- Next file: `references/components/scroll-view/guide.md`

### Use `Swiper`

- For horizontal paging or carousel-like content.
- Good fit for banners, card carousels, onboarding swipes, and paged horizontal content.
- Avoid when the need is simple scrolling without page snapping.
- Next file: `references/components/swiper/guide.md`

## Coverage Notes

- This skill only routes components that have curated references bundled in this package.
- If the target component is missing, say so explicitly and fall back to repository sources instead of pretending the skill covers it.
- For the current bundled component list, see `references/index.md`.
