// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export interface ApiReferenceConfig {
  /** Public component parts to document, in display order. */
  parts: readonly string[]
  /** Public ref entities to document, in display order. */
  refs?: readonly string[]
  /** Additional API types grouped under Supporting Types, in display order. */
  supportingTypes?: readonly string[]
  /** Public types represented inside another entity instead of a section. */
  embeddedTypes?: readonly string[]
  /** Deprecated public aliases represented by their canonical entities. */
  aliases?: readonly string[]
  /** Public types intentionally omitted from the generated API reference. */
  excludedTypes?: Readonly<Record<string, string>>
}

/**
 * Explicit API publication and ordering for every generated API reference.
 */
export const apiReferenceConfig: Readonly<
  Record<string, ApiReferenceConfig>
> = {
  'lynx-ui-view-pager': {
    parts: ['ViewPager'],
    refs: ['ViewPagerRef'],
    supportingTypes: [
      'ViewPagerItemProps',
      'ViewPagerExposureMargin',
      'ViewPagerLazyOptions',
      'ViewPagerChangeEvent',
      'ViewPagerWillChangeEvent',
      'ViewPagerOffsetChangeEvent',
    ],
  },
  'lynx-ui-scroll-coordinator': {
    parts: ['ScrollCoordinator'],
    refs: ['ScrollCoordinatorRef'],
    supportingTypes: [
      'ScrollCoordinatorOffset',
      'ScrollCoordinatorRefreshOptions',
    ],
    embeddedTypes: ['ScrollCoordinatorUIVariants'],
  },
  'lynx-ui-button': {
    parts: ['Button'],
  },
  'lynx-ui-switch': {
    parts: ['Switch', 'SwitchTrack', 'SwitchThumb'],
    embeddedTypes: ['SwitchRenderProps'],
  },
  'lynx-ui-sheet': {
    parts: [
      'SheetRoot',
      'SheetBackdrop',
      'SheetView',
      'SheetContent',
      'SheetHandle',
    ],
    refs: ['SheetRootRef'],
    supportingTypes: [
      'SheetSide',
      'SheetTransition',
      'SheetTransitionSpring',
      'SheetTransitionTween',
    ],
  },
  'lynx-ui-dialog': {
    parts: [
      'DialogRoot',
      'DialogTrigger',
      'DialogBackdrop',
      'DialogView',
      'DialogContent',
      'DialogClose',
    ],
    embeddedTypes: ['PresenceAnimationStatus'],
  },
  'lynx-ui-popover': {
    parts: [
      'PopoverRoot',
      'PopoverTrigger',
      'PopoverAnchor',
      'PopoverPositioner',
      'PopoverBackdrop',
      'PopoverContent',
      'PopoverArrow',
    ],
    supportingTypes: ['PopoverOverlayProps'],
    embeddedTypes: ['PresenceAnimationStatus'],
  },
  'lynx-ui-radio-group': {
    parts: ['RadioGroupRoot', 'Radio', 'RadioIndicator'],
  },
  'lynx-ui-draggable': {
    parts: ['Draggable', 'DraggableArea'],
    refs: ['DraggableRef'],
  },
  'lynx-ui-form': {
    parts: ['FormRoot', 'FormField', 'FormSubmitButton'],
    embeddedTypes: ['FormSubmitButtonUIVariants'],
  },
  'lynx-ui-checkbox': {
    parts: ['Checkbox', 'CheckboxIndicator'],
  },
  'lynx-ui-slider': {
    parts: ['SliderRoot', 'SliderTrack', 'SliderIndicator', 'SliderThumb'],
    refs: ['SliderRef'],
    supportingTypes: [
      'SliderRangeValue',
      'SliderValue',
      'SliderThumbIndex',
      'SliderValueChangeSource',
      'SliderUpdateValueOptions',
    ],
    embeddedTypes: ['SliderUIVariants'],
  },
  'lynx-ui-input-otp': {
    parts: ['InputOTP', 'InputOTPSlot'],
    refs: ['InputOTPRef'],
    supportingTypes: ['InputOTPInputType', 'InputOTPLength'],
    embeddedTypes: [
      'InputOTPRenderProps',
      'InputOTPSlotRenderProps',
      'InputOTPUIVariants',
      'InputOTPSlotUIVariants',
    ],
  },
  'lynx-ui-input': {
    parts: [
      'Input',
      'TextArea',
      'KeyboardAwareRoot',
      'KeyboardAwareTrigger',
      'KeyboardAwareResponder',
    ],
    refs: ['InputRef', 'TextAreaRef', 'KeyboardAwareResponderRef'],
  },
  'lynx-ui-sortable': {
    parts: ['SortableRoot', 'SortableItem'],
    supportingTypes: ['SortableData'],
  },
  'lynx-ui-swiper': {
    parts: ['Swiper', 'SwiperItem'],
    refs: ['SwiperRef'],
    supportingTypes: [
      'RenderFunctionProps',
      'BounceConfig',
      'OnBounceParams',
      'SwipeToOptions',
    ],
  },
  'lynx-ui-feed-list': {
    parts: ['FeedList'],
    refs: ['FeedListRef'],
    supportingTypes: [
      'BounceableBasicProps',
      'RefreshProps',
      'UseRefreshAndBounceReturn',
    ],
    aliases: ['useRefreshAndBounceReturn'],
  },
  'lynx-ui-scroll-view': {
    parts: ['ScrollView'],
    refs: ['ScrollViewRef'],
    supportingTypes: [
      'BounceableBasicProps',
      'ScrollToBouncesInfo',
      'BounceHandlers',
    ],
    aliases: ['bounceHandlers'],
  },
  'lynx-ui-tab-group': {
    parts: [
      'TabsRoot',
      'TabsBar',
      'TabsItem',
      'TabsPanel',
      'TabsIndicator',
    ],
    refs: ['TabsRootRef', 'TabsPanelRef'],
    supportingTypes: ['TabsIndicatorAnimation'],
    aliases: ['TabItemProps'],
  },
  'lynx-ui-deferred-component': {
    parts: ['DeferredComponent'],
    refs: ['DeferredComponentRef'],
  },
  'lynx-ui-lazy-component': {
    parts: ['LazyComponent'],
    refs: ['LazyComponentRef'],
  },
  'lynx-ui-list': {
    parts: ['List'],
    refs: ['ListRef'],
    supportingTypes: [
      'DiffResultDetails',
      'LayoutCompleteEvent',
      'LayoutCompleteEventDetail',
      'ListItemInfo',
      'ListItemSnapAlignment',
    ],
  },
  'lynx-ui-overlay': {
    parts: ['OverlayView'],
    refs: ['OverlayViewRef'],
  },
  'lynx-ui-swipe-action': {
    parts: ['SwipeAction'],
    refs: ['SwipeActionRef'],
  },
}
