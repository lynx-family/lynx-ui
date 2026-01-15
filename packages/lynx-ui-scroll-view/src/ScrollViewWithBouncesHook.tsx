// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ForwardedRef, ReactElement } from '@lynx-js/react'

import '@lynx-js/gesture-runtime'
import { useBounce } from '@lynx-js/lynx-ui-common'
import type { BounceableBasicProps } from '@lynx-js/lynx-ui-common'
import type {
  CSSProperties,
  ScrollViewProps as ScrollViewElementProps,
} from '@lynx-js/types'

import type { ScrollViewProps, ScrollViewRef } from './types'

export type { ScrollViewProps, ScrollViewRef }

function ScrollViewWithBouncesHook(
  props: {
    elementProps: ScrollViewElementProps
    children?:
      | (ReactElement[] | ReactElement)[]
      | ReactElement
      | ReactElement[]
    bounceableOptions?: BounceableBasicProps
    sticky?: ReactElement
  },
  _ref: ForwardedRef<ScrollViewRef>,
) {
  const { children, bounceableOptions, sticky, elementProps } = props
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const horizontal = elementProps['scroll-x']
    ?? elementProps['scroll-y'] === false
  const scrollViewId = elementProps.id
  const { style } = elementProps as { style: CSSProperties }
  // Initialize bounceableProps
  let enableBounce = false
  let bounceableProps: BounceableBasicProps = { enableBounces: false }
  let startBounceView, endBounceView, upperExposureView, lowerExposureView
  if (typeof bounceableOptions === 'boolean') {
    enableBounce = bounceableOptions
    bounceableProps = {
      enableBounces: true,
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
  const bounceMTSProps = useBounce({
    bounceableOptions: bounceableProps,
    id: scrollViewId,
    scrollOrientation: horizontal ? 'horizontal' : 'vertical',
  })
  if (enableBounce) {
    if (bounceableProps.upperBounceItem) {
      startBounceView = (
        <view
          id={`${scrollViewId}-upperBounceWrapper`}
          style={`position:absolute;${
            horizontal ? 'right:100%' : 'bottom:100%'
          }; ${horizontal ? 'height:100%;' : 'width:100%;'};${
            horizontal ? 'width:max-content' : 'height:max-content'
          };`}
          main-thread:gesture={elementProps['main-thread:gesture']}
        >
          {bounceableProps.upperBounceItem}
        </view>
      )
    }
    if (bounceableProps.lowerBounceItem) {
      endBounceView = (
        <view
          id={`${scrollViewId}-lowerBounceWrapper`}
          style={`position:absolute;${horizontal ? 'left:100%' : 'top:100%'}; ${
            horizontal ? 'height:100%;' : 'width:100%;'
          };${horizontal ? 'width:max-content' : 'height:max-content'};`}
          main-thread:gesture={elementProps['main-thread:gesture']}
        >
          {bounceableProps.lowerBounceItem}
        </view>
      )
    }
    upperExposureView = (
      <view
        style={`display: flex; flex-direction: column; overflow:hidden; height: ${
          horizontal ? '100%' : '1ppx'
        }; width: ${horizontal ? '1ppx' : '100%'};`}
        exposure-scene={scrollViewId}
        exposure-id='upperExposureView'
        id={`${scrollViewId}-upperExposureView`}
        main-thread:binduidisappear={bounceMTSProps.onUpperDisexposure}
        main-thread:binduiappear={bounceMTSProps.onUpperExposure}
        main-thread:gesture={elementProps['main-thread:gesture']}
      />
    )
    lowerExposureView = (
      <view
        style={`display: flex; flex-direction: column; overflow:hidden; height: ${
          horizontal ? '100%' : '1ppx'
        }; width: ${horizontal ? '1ppx' : '100%'};`}
        exposure-scene={scrollViewId}
        exposure-id='lowerExposureView'
        id={`${scrollViewId}-lowerExposureView`}
        main-thread:binduidisappear={bounceMTSProps.onLowerDisexposure}
        main-thread:binduiappear={bounceMTSProps.onLowerExposure}
        main-thread:gesture={elementProps['main-thread:gesture']}
      />
    )
  }

  return (
    <view
      id={`${scrollViewId}-BounceWrapper`}
      style={`display: flex; flex-direction: column; overflow:hidden; height: ${
        horizontal ? '100%' : `${style?.height}`
      }; width: ${horizontal ? `${style?.width}` : '100%'};`}
      main-thread:gesture={elementProps['main-thread:gesture']}
    >
      <scroll-view
        {...elementProps}
        {...bounceMTSProps}
        bounces={false}
        ios-enable-simultaneous-touch={true}
        // This is a workaround for using RL3.0-ver 0.110.1 and SDK-ver <=3.4. It will force the scroll-view to update after the BTS is ready and flush the 'name' prop along with __AddEvents. Otherwise, a pure __AddEvents will be discarded by the engine and won't trigger the flush of the prop_bundle. As a result, all events will be lost.
        // We do not use __MAIN_THREAD__ here to maintain compatibility with the old version of @lynx-js/react.
        name={__LEPUS__ ? 'lepus' : 'background'}
      >
        {upperExposureView}
        {sticky}
        {children}
        {lowerExposureView}
      </scroll-view>
      {startBounceView}
      {endBounceView}
    </view>
  )
}

export default ScrollViewWithBouncesHook
