# @lynx-js/lynx-ui-calendar

Headless calendar primitive for ReactLynx applications built with lynx-ui.

## Installation

```bash
npm install @lynx-js/lynx-ui-calendar
```

## Usage

```tsx
import { Calendar } from '@lynx-js/lynx-ui-calendar'

<Calendar />
```

`Calendar` renders a native `<viewpager>` with each month laid out as a five-row
Lynx grid. Day cells are direct grid items, keeping the default month view
shallow.
It supports controlled and uncontrolled date selection, controlled and
uncontrolled visible month state, outside days, custom day rendering, slot class
names, and `dayStyle` for applying per-day state styles without state class
concatenation. By default, the component caches loaded month pages and each
one-page navigation loads only the next adjacent page entering the user's path.
Rendered page and day lists use index keys to favor view reuse as the sliding
window moves, while the off-center side pages are mounted through
`LazyComponent` with index-based scenes.
