---
'@lynx-js/lynx-ui-slider': minor
'@lynx-example/lynx-ui-slider': patch
'@lynx-js/skill-lynx-ui': patch
---

Add ordered two-thumb range selection to `SliderRoot`, including controlled and uncontrolled tuples, indexed thumbs, step snapping, non-crossing drag behavior, and a price-range example. Single and range values share `SliderRootProps<Value>` and `SliderRef<Value>`; React-extracted props and refs use the neutral `SliderValue` shape, while the generic defaults to `number` for existing explicit annotations.
