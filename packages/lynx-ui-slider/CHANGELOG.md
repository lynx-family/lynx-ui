# @lynx-js/lynx-ui-slider

## 3.130.1

- Introduced primitives-first slider components:
  - `SliderRoot`
  - `SliderTrack`
  - `SliderRange`
  - `SliderThumb`
- Added compatibility facade component `Slider`.
- Added imperative API via `SliderRef` (`updateProgress`, `getProgress`).
- Added export integration in aggregate package `@lynx-js/lynx-ui`.
- Track/thumb visual customization is designed to be done via CSS classes or inline style instead of dedicated size/color props.
