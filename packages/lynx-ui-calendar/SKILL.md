# Calendar Skill

Use this skill when building or customizing calendar experiences with
`@lynx-js/lynx-ui-calendar`.

## Core Model

- `Calendar` is a headless month calendar primitive. It renders a default
  shadcn-inspired structure with the month as a five-row grid container and days as
  direct grid items, but styling is supplied by `className` and `classNames`
  slots. Use `dayStyle` for hot-path day state styles when avoiding per-cell
  state class concatenation matters.
- Month paging uses the native `<viewpager>` element. Calendar renders only an
  odd-sized sliding window of month pages around the current month, controlled by
  `monthWindowSize` and defaulting to 5 pages.
- Month data is cached by month key. With `progressiveMonthLoading` enabled, the
  initial load includes the visible month and adjacent swipe targets; each
  one-page navigation adds only the next adjacent page in the navigation
  direction.
- The default month renderer uses index keys for page, week, and day lists to
  maximize native view reuse while the sliding window moves.
- Off-center side pages are wrapped in `LazyComponent` with index-based scenes
  and `unmountOnExit` enabled.
- Day data is windowed too. `getDayData(date)` is evaluated only for loaded
  month pages, not for an unbounded date range.
- Use `value` with `onValueChange` for controlled selection, or `defaultValue`
  for uncontrolled selection.
- Use `month` with `onMonthChange` for controlled visible-month state, or
  `defaultMonth` for uncontrolled visible-month state.

## Prompt Formula

> Selection mode + visible month control + page window size + disabled date
> rules + progressive loading preference + day cell rendering + LUNA or app
> styling.

Examples:

- "Create a controlled Calendar with `value`, `month`, and `onMonthChange`, with
  weekends disabled and booked days rendered with a dot."
- "Render a compact Calendar using `monthWindowSize={5}`, hide outside days, and
  style selected/today/outside states through `dayStyle`."
- "Disable `progressiveMonthLoading` when custom composed children need every
  page in `pages` to contain a full day grid immediately."

## Pitfalls

- Keep `monthWindowSize` small unless there is a specific reason to preload more
  months. The default 5-page window is the usual choice.
- Check `page.loaded` before reading `page.days` from custom composed children.
  Unloaded placeholder pages expose an empty day array.
- Do not replace `<viewpager-item>` with another direct child inside
  `CalendarMonths`; native viewpager requires direct `viewpager-item` children.
- If examples need theme variables, import `@lynx-js/luna-styles/index.css` and
  apply a LUNA theme class at the root.
