---
"@lynx-js/lynx-ui-sheet": minor
---

Add SheetBody with optional viewport insets. Keep content within the supplied edges while the Sheet panel and handle move. Bottom sheets using a fit snap measure their content within the available width.

Move bounded bottom panels with translation and clipping at a fixed surface height. Use `cornerRadius` to round the sheet, including its clipped bottom corners. Radius and gap changes animate together, and the footer stays inside the panel at the largest snap.

Keep bottom sheet body layouts stable during vertical motion using translation and clipping. Bound fit snaps to the available panel height so oversized content can scroll within the viewport.

Keep the body inside horizontal viewport insets when a sheet changes width on an immediate snap.
