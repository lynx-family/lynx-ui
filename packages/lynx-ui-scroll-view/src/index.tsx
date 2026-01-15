// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { forwardRef, memo, useRef } from '@lynx-js/react'
import type { ForwardedRef, ReactElement } from '@lynx-js/react'

import '@lynx-js/gesture-runtime'
import type { GestureKind } from '@lynx-js/gesture-runtime'
import type { BounceableBasicProps, LazyOptions } from '@lynx-js/lynx-ui-common'
import {
  ExposureEventsMapping,
  LayoutEventsMapping,
  ScrollEventsMapping,
  TouchEventsMapping,
  useRegisteredEvents,
} from '@lynx-js/lynx-ui-common'
import { LazyComponent } from '@lynx-js/lynx-ui-lazy-component'
import type {
  CSSProperties,
  ScrollViewProps as ScrollViewElementProps,
} from '@lynx-js/types'

import ScrollViewBasic from './ScrollViewBasic'
import ScrollViewWithBouncesHook from './ScrollViewWithBouncesHook'
import type {
  ScrollViewProps,
  ScrollViewRef,
  ScrollView as ScrollViewType,
} from './types'

export type { ScrollViewProps, ScrollViewRef }

export const ScrollView = memo(forwardRef(ScrollViewImpl)) as ScrollViewType

const ScrollViewEventMapping: Record<string, string> = {
  onContentSizeChange: 'bindcontentsizechanged',
}

/**
 * @example
 * ```javascript
 * <ScrollView
                  scene={`viewpager_${index1}`}
                  style={{ width: '100%', height: '100%' }}
                  estimatedItemStyle={{ width: '100%', height: '800px' }}
                  scrollOrientation='vertical'
                  exposureRight="50px"
                  exposureBottom="220px"
                >
                  {scrollview.map((item, index) => (
                    <view
                      style={`width:100%;height:580rpx;`}
                    >
                      <text>{`slot-${index}`}</text>
                    </view>
                  ))}
                </ScrollView>
 * ```
 */
function ScrollViewImpl(
  props: ScrollViewProps,
  _ref: ForwardedRef<ScrollViewRef>,
) {
  const {
    scrollviewId = 'scrollview',
    horizontal = false,
    style,
    children,
    scrollOrientation,
    lazyOptions,
    className = '',
    bounceableOptions = {
      enableBounces: true,
      singleSidedBounce: 'iOSBounces',
    },
    enableScrollMonitor = false,
    scrollMonitorTag,
    sticky,
    scrollPropagationBehavior = 'native',
    temporaryBlockScrollClass = 'BDXLynxViewPager',
    temporaryBlockScrollTag = 0,
    temporaryNestedScroll,
    androidTouchSlop,
    'main-thread:gesture': gesture,
  } = props
  // generates binding events dynamically
  const scrollViewRegisteredEvents = useRef<Record<string, string>>({
    ...ScrollEventsMapping,
    ...ExposureEventsMapping,
    ...TouchEventsMapping,
    ...LayoutEventsMapping,
    ...ScrollViewEventMapping,
  })
  const normalizedLazyOptions: LazyOptions | undefined = lazyOptions
    ? { firstScreenItemCount: 1, ...lazyOptions }
    : undefined
  const registerEvents = useRegisteredEvents(
    props,
    scrollViewRegisteredEvents.current,
  )

  const isHorizontal = () => {
    return scrollOrientation ? scrollOrientation === 'horizontal' : horizontal
  }

  // Initialize bounceableProps
  let enableBounce = false
  let bounceableProps: BounceableBasicProps = { enableBounces: false }
  if (typeof bounceableOptions === 'boolean') {
    // Initialize the default value if the bounceableOptions is simply 'true' without specific options
    enableBounce = bounceableOptions
    bounceableProps = {
      enableBounces: enableBounce,
      singleSidedBounce: 'both',
      alwaysBouncing: true,
      validAnimationVersion: true,
    }
  } else if (typeof bounceableOptions === 'object') {
    enableBounce = bounceableOptions.enableBounces
    bounceableProps = bounceableOptions
    bounceableProps.singleSidedBounce = bounceableOptions.singleSidedBounce
      ?? 'both'
    bounceableProps.alwaysBouncing = bounceableOptions.alwaysBouncing ?? true
    bounceableProps.validAnimationVersion =
      bounceableOptions.validAnimationVersion ?? true
  }
  // Only when the enableBounces is true and singleSidedBounce is set to 'iOSBounces' will it use default bounces effect on iOS.
  const platformBounces = enableBounce
    && bounceableProps?.singleSidedBounce === 'iOSBounces'

  const shouldEnableNested = () => {
    if (
      SystemInfo.platform === 'iOS' && scrollPropagationBehavior !== 'propagate'
    ) {
      return false
    }
    return true
  }

  type childrenType =
    | (ReactElement[] | ReactElement)[]
    | ReactElement
    | ReactElement[]
    | undefined
  const renderChildren = (
    children: childrenType,
    lazyOptions: LazyOptions | undefined,
  ) => {
    if (!Array.isArray(children)) {
      return children
    }
    const lazy = lazyOptions?.enableLazy
    return children.map((item: ReactElement, index: number) => {
      if (lazy && index >= Number(lazyOptions?.firstScreenItemCount)) {
        return (
          <LazyComponent
            key={`${scrollviewId}_lazy_${index}`}
            scene={lazyOptions?.scene}
            pid={`pid_${index}`}
            estimatedStyle={lazyOptions?.estimatedItemStyle}
            top={lazyOptions?.exposureTop}
            bottom={lazyOptions?.exposureBottom}
            left={lazyOptions?.exposureLeft}
            right={lazyOptions?.exposureRight}
          >
            {item}
          </LazyComponent>
        )
      }
      return item
    })
  }

  // These props will be spread directly to <scroll-view> element. Make sure it's valid
  type ExtendedScrollViewElementProps = ScrollViewElementProps & {
    'scroll-x': boolean
    'scroll-y': boolean
  }
  const elementProps: ExtendedScrollViewElementProps & {
    'enable-scroll-monitor': boolean
    'scroll-monitor-tag'?: string
    'main-thread:gesture'?: GestureKind
    'enable-new-nested'?: boolean
    'enable-nested-scroll'?: boolean
    'force-can-scroll'?: boolean
    'ios-block-gesture-class'?: string
    'ios-recognized-view-tag'?: number
    'className'?: string
    'style'?: CSSProperties
    'bounces'?: boolean
  } = {
    'id': scrollviewId,
    'scroll-x': isHorizontal(),
    'scroll-y': !isHorizontal(),
    'enable-scroll-monitor': enableScrollMonitor,
    'scroll-monitor-tag': scrollMonitorTag,
    'main-thread:gesture': gesture as GestureKind,
    'force-can-scroll': scrollPropagationBehavior === 'preventPropagate',
    'ios-block-gesture-class': scrollPropagationBehavior === 'preventPropagate'
      ? temporaryBlockScrollClass
      : '',
    'ios-recognized-view-tag': scrollPropagationBehavior === 'preventPropagate'
      ? temporaryBlockScrollTag
      : 0,
    'enable-nested-scroll': SystemInfo.platform === 'Android'
      ? (temporaryNestedScroll ?? true)
      : shouldEnableNested(),
    'enable-new-nested': true,
    'className': className,
    'style': style,
    'bounces': platformBounces,
    ...(androidTouchSlop !== undefined
      && { 'android-touch-slop': androidTouchSlop }),
    ...registerEvents,
  }

  if (
    enableBounce
    && bounceableProps.singleSidedBounce !== 'iOSBounces'
    && bounceableProps.singleSidedBounce !== 'none'
  ) {
    return (
      <ScrollViewWithBouncesHook
        elementProps={elementProps}
        bounceableOptions={bounceableProps}
        sticky={sticky}
      >
        {renderChildren(children, normalizedLazyOptions)}
      </ScrollViewWithBouncesHook>
    )
  } else {
    return (
      <ScrollViewBasic elementProps={elementProps} sticky={sticky}>
        {renderChildren(children, normalizedLazyOptions)}
      </ScrollViewBasic>
    )
  }
}
