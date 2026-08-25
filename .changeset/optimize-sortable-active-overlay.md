---
'@lynx-js/lynx-ui-sortable': patch
'@lynx-js/lynx-ui-draggable': patch
---

Render only the active Sortable drag overlay and keep item gesture handlers
stable across reorders. Measure only the scroll boundary and active item, and
reset dirty item visuals in the same commit as the new order.
