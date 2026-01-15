// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Aggregate re-exports for Lynx UI open-source packages.
// Excludes lynx-ui-overlay and lynx-ui-presence.

// common (hooks, utils, const, reactive)
export {
  // hooks
  useUnmount,
  useGlobalEventListener,
  useLatest,
  useRegisteredEvents,
  useRefreshAndBounce,
  useMemoizedFn,
  usePrevious,
  useFirstRender,
  useJSFirstRender,
  useLepusFirstRender,
  usePersistCallback,
  useThrottle,
  // utils
  get,
  noop,
  lynxSDKVersionStringToNumber,
  mtsLynxSDKVersionStringToNumber,
  nativeLynxSDKVersionGreaterThan,
  nativeLynxSDKVersionLessThan,
  mtsNativeLynxSDKVersionLessThan,
  InvokeRejectError,
  setNativePropsByRef,
  setNativePropsById,
  setNativeProps,
  invokeByRef,
  invokeById,
  invoke,
  getRectByRef,
  getRootRect,
  getRectById,
  getRect,
  selectorMT,
  convertOverlayMode,
  convertToPx,
  screenWidth,
  screenHeight,
  interpolate,
  interpolateJS,
  renderContentWithExtraProps,
  delayFrames,
  getEventDetail,
  mainThreadifyEventsMapping,
  // const
  ExposureEventsMapping,
  LayoutEventsMapping,
  ScrollEventsMapping,
  TouchEventsMapping,
  // reactive fns
  useReactiveValue,
  useReactiveValueEvent,
  updateReactiveValue,
  useReactiveValueChange,
  // react-use re-exported by common
  useMainThreadImperativeHandle,
} from '@lynx-js/lynx-ui-common'
export type {
  // common types
  useRefreshAndBounceReturn,
  bounceHandlers,
} from '@lynx-js/lynx-ui-common'
export type {
  ReactiveValueOptions,
  ReactiveValueAPI,
  ReactiveValueType,
  Subscriber,
  Unsubscribe,
  EventDetailWithLayout,
} from '@lynx-js/lynx-ui-common'

// button
export { Button, ButtonContext } from '@lynx-js/lynx-ui-button'
export type { ButtonProps } from '@lynx-js/lynx-ui-button'

// checkbox
export { Checkbox, CheckboxIndicator } from '@lynx-js/lynx-ui-checkbox'
export type {
  CheckboxProps,
  CheckboxIndicatorProps,
} from '@lynx-js/lynx-ui-checkbox'

// dialog
export {
  DialogView,
  DialogRoot,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogBackdrop,
} from '@lynx-js/lynx-ui-dialog'
export type {
  DialogBackdropProps,
  DialogContentProps,
  DialogRootProps,
  DialogTriggerProps,
  DialogCloseProps,
  DialogViewProps,
} from '@lynx-js/lynx-ui-dialog'

// draggable
export {
  Draggable,
  DraggableRoot,
  DraggableArea,
} from '@lynx-js/lynx-ui-draggable'
export { useDraggable } from '@lynx-js/lynx-ui-draggable'
export type {
  DraggableProps,
  DraggableAreaProps,
  DraggableRef,
} from '@lynx-js/lynx-ui-draggable'

// feed-list
export { FeedList } from '@lynx-js/lynx-ui-feed-list'
export type { FeedListRef, FeedListProps } from '@lynx-js/lynx-ui-feed-list'

// form
export { FormRoot, FormSubmitButton, FormField } from '@lynx-js/lynx-ui-form'
export { FormContext } from '@lynx-js/lynx-ui-form'
export type {
  FormRootProps,
  FormSubmitButtonProps,
  FormFieldProps,
} from '@lynx-js/lynx-ui-form'

// input
export {
  Input,
  TextArea,
  KeyboardAwareRoot,
  KeyboardAwareTrigger,
  KeyboardAwareResponder,
  KeyboardAwareRootContext,
  KeyboardAwareTriggerContext,
} from '@lynx-js/lynx-ui-input'
export type {
  InputProps,
  InputRef,
  TextAreaProps,
  TextAreaRef,
  KeyboardAwareTriggerProps,
  KeyboardAwareResponderProps,
  KeyboardAwareRootProps,
} from '@lynx-js/lynx-ui-input'

// lazy-component
export { LazyComponent } from '@lynx-js/lynx-ui-lazy-component'
export type {
  LazyComponentRef,
  LazyComponentProps,
} from '@lynx-js/lynx-ui-lazy-component'

// list
export { List } from '@lynx-js/lynx-ui-list'
export type { ListRef, ListProps } from '@lynx-js/lynx-ui-list'

// popover
export {
  PopoverContext,
  useElementInfoReducer,
  PopoverArrow,
  PopoverAnchor,
  PopoverTrigger,
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
} from '@lynx-js/lynx-ui-popover'
export type {
  PopoverOverlayProps,
  PopoverArrowProps,
  PopoverAnchorProps,
  PopoverContentProps,
  PopoverPositionerProps,
  PopoverRootProps,
  PopoverTriggerProps,
} from '@lynx-js/lynx-ui-popover'

// radio-group
export {
  RadioIndicator,
  Radio,
  RadioGroupRoot,
} from '@lynx-js/lynx-ui-radio-group'
export type {
  RadioGroupRootProps,
  RadioIndicatorProps,
  RadioProps,
} from '@lynx-js/lynx-ui-radio-group'

// scroll-view
export { ScrollView } from '@lynx-js/lynx-ui-scroll-view'
export type {
  ScrollViewProps,
  ScrollViewRef,
} from '@lynx-js/lynx-ui-scroll-view'

// sortable
export {
  SortableRoot,
  SortableItem,
  SortableItemArea,
} from '@lynx-js/lynx-ui-sortable'
export type {
  SortableItemProps,
  SortableRootProps,
  SortableData,
} from '@lynx-js/lynx-ui-sortable'

// swipe-action
// Temporarily export types only; value export is omitted to align with current module declarations.
export { SwipeAction } from '@lynx-js/lynx-ui-swipe-action'
export type {
  SwipeActionProps,
  SwipeActionRef,
} from '@lynx-js/lynx-ui-swipe-action'

// swiper
export { Swiper, SwiperItem } from '@lynx-js/lynx-ui-swiper'
export type { SwiperItemProps } from '@lynx-js/lynx-ui-swiper'
export type { SwiperProps, SwiperRef } from '@lynx-js/lynx-ui-swiper'

// switch
export { Switch, SwitchThumb, SwitchTrack } from '@lynx-js/lynx-ui-switch'
export type {
  SwitchProps,
  SwitchThumbProps,
  SwitchTrackProps,
  SwitchRenderProps,
} from '@lynx-js/lynx-ui-switch'

// only presence types are exported
export type {
  PresenceAnimationStatus,
  PresenceState,
} from '@lynx-js/lynx-ui-presence'
