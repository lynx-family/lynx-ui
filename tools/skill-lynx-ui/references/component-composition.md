# Component Composition

Read this file when a task combines components. Use
[`component-overview.md`](./component-overview.md) for single-component
selection and each component API reference for exact props.

## Common combinations

| Need | Use together | Key rule | Example |
|---|---|---|---|
| Defer expensive content in a long scrolling region | `ScrollView` + `LazyComponent` | Put `LazyComponent` inside the scrolling container and provide an accurate `estimatedStyle`. | [VisibilityMargin](./components/lazy-component/examples.md#visibilitymargin) |
| Defer expensive carousel slide bodies | `Swiper` + `LazyComponent` | Put `LazyComponent` inside each `SwiperItem`. | [Lazy](./components/swiper/examples.md#lazy) |
| Keep text fields visible above the soft keyboard | `Input` or `TextArea` + `KeyboardAwareRoot` + `KeyboardAwareResponder` + `KeyboardAwareTrigger` | Wrap each field that should move into view with `KeyboardAwareTrigger`. | [KeyboardAwareInScrollView](./components/input/examples.md#keyboardawareinscrollview) |
| Build a keyboard-aware multi-field submit flow | `Form` + `Input` or `TextArea` + keyboard-aware wrappers | Use `FormField` for collected values and `FormSubmitButton` for submission. | [KeyboardAware](./components/form/examples.md#keyboardaware) |
| Reveal row actions inside scrolling content | `SwipeAction` + scrolling container | Keep row actions in `actionArea` and coordinate horizontal swipe with vertical scrolling. | [WithScrollView](./components/swipe-action/examples.md#withscrollview) |
| Reorder rows inside scrolling content | `Sortable` + scrolling container | Disable parent scrolling while sorting when the gestures compete. | [WithScrollView](./components/sortable/examples.md#withscrollview) |
| Use sliders inside scrolling content | `Slider` + scrolling container | Keep slider gestures on `SliderRoot`. | [WithScrollView](./components/slider/examples.md#withscrollview) |
| Anchor floating content inside a scrolling region | `Popover` + `ScrollView` | Keep the documented popover structure and verify stacking behavior in the scrolling container. | [WithScrollView](./components/popover/examples.md#withscrollview) |
