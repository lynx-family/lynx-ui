---
"@lynx-js/lynx-ui-sortable": minor
---

feat(sortable): support `disabled` items that always keep their absolute position

`SortableItem` now accepts a `disabled` prop. Disabled items cannot be dragged
themselves and are never displaced by other items' dragging — they always keep
their absolute position in the final sorted order. Other items can still
freely cross over them, and only the relative order of non-disabled items can
change.

The cross-over translate compensation is scoped to the disabled gap strictly
between the swap target and its previous movable neighbor, so consecutive
swaps across alternating locked / unlocked items land each item at the
expected slot without over-shooting.
