---
"@lynx-js/lynx-ui-sheet": minor
---

Add `SheetGestureContent` with one coordinated native scroll gesture exposed by
both a render prop and the argument-free `useSheetScrollGesture` Hook. Nested
scrolling now follows a fixed natural handoff: expand the Sheet before scrolling
content, and return content to its start before collapsing the Sheet.
