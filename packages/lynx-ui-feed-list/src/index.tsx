// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ForwardedRef, ReactElement } from '@lynx-js/react'
import {
  forwardRef,
  memo,
  runOnMainThread,
  useImperativeHandle,
  useRef,
  useState,
} from '@lynx-js/react'

import { useRefreshAndBounce } from '@lynx-js/lynx-ui-common'
import type {
  BounceableBasicProps,
  RefreshProps,
  useRefreshAndBounceReturn,
} from '@lynx-js/lynx-ui-common'
import { List } from '@lynx-js/lynx-ui-list'
import type { ListRef } from '@lynx-js/lynx-ui-list'

import type {
  FeedListProps,
  FeedListRef,
  FeedList as FeedListType,
} from './types'
import './styles.css'

export type { FeedListRef, FeedListProps }
export type {
  BounceableBasicProps,
  RefreshProps,
} from '@lynx-js/lynx-ui-common'

const FeedListExcludedJSXProperties: string[] = [
  'children',
  'refreshOptions',
  'bounceableOptions',
  'loadMoreFooter',
  'noMoreDataFooter',
]

export const FeedList = memo(forwardRef(FeedListImpl)) as FeedListType

function FeedListImpl(props: FeedListProps, ref: ForwardedRef<FeedListRef>) {
  const {
    refreshOptions = false,
    bounceableOptions = false,
    listId = 'feedList',
    loadMoreFooter = null,
    noMoreDataFooter = null,
    'main-thread:gesture': gesture,
    iosEnableSimultaneousTouch = true,
    scrollOrientation,
    children = null,
    style,
    bounces,
  } = props
  const [hasMoreData, setHasMoreData] = useState(true)
  const baseListRef = useRef<ListRef>(null)
  let refreshProps: RefreshProps, bounceableProps: BounceableBasicProps
  // Initialize refreshProps
  let enableRefresh = false
  if (typeof refreshOptions === 'boolean') {
    enableRefresh = refreshOptions
    refreshProps = {
      enableRefresh: enableRefresh,
      // todo(fangzhou.fz): refreshOptions should not be a single boolean. It should be an object and set header.
      // @ts-expect-error error
      headerContent: null,
    }
  } else if (typeof refreshOptions === 'object') {
    ;({ enableRefresh } = refreshOptions)
    refreshProps = refreshOptions
  }

  // Initialize bounceableProps
  let enableBounce = false
  if (typeof bounceableOptions === 'boolean') {
    enableBounce = bounceableOptions
    bounceableProps = {
      enableBounces: enableBounce,
      singleSidedBounce: 'both',
      alwaysBouncing: false,
      validAnimationVersion: true,
    }
  } else if (typeof bounceableOptions === 'object') {
    enableBounce = bounceableOptions.enableBounces
    bounceableProps = { singleSidedBounce: 'both', ...bounceableOptions }
  }

  const useRefreshAndBounceProps: useRefreshAndBounceReturn | null =
    enableBounce || enableRefresh
      // biome-ignore lint/correctness/useHookAtTopLevel: expected
      ? useRefreshAndBounce({
        // @ts-expect-error error
        bounceableOptions: bounceableProps,
        // @ts-expect-error error
        refreshOptions: refreshProps,
        id: listId,
        scrollOrientation: scrollOrientation,
      })
      : null
  // @ts-expect-error error
  let refreshHeader: ReactElement = null
  if (enableRefresh) {
    refreshHeader = (
      <view
        id={`${listId}-refreshHeaderWrapper`}
        class='vertical-start-wrapper'
        main-thread:bindlayoutchange={(e) => {
          'main thread'
          // @ts-expect-error error

          useRefreshAndBounceProps.onRefreshHeaderLayoutUpdated(e)
        }}
      >
        {
          // @ts-expect-error error
          refreshProps.headerContent
        }
      </view>
    )
  }
  // @ts-expect-error error
  let startBounceView: ReactElement = null
  // @ts-expect-error error
  let endBounceView: ReactElement = null
  // @ts-expect-error error
  let upperExposureView: ReactElement = null
  // @ts-expect-error error
  let lowerExposureView: ReactElement = null
  const horizontal = scrollOrientation === 'horizontal'
  if (enableBounce) {
    // Refresh has higher priority than normal bounce-view
    // @ts-expect-error error
    if (!enableRefresh && bounceableProps.upperBounceItem) {
      startBounceView = (
        <view
          id={`${listId}-upperBounceWrapper`}
          class={horizontal
            ? 'horizontal-start-wrapper'
            : 'vertical-start-wrapper'}
        >
          {
            // @ts-expect-error error
            bounceableProps.upperBounceItem
          }
        </view>
      )
    }
    // @ts-expect-error error
    if (bounceableProps.lowerBounceItem) {
      endBounceView = (
        <view
          id={`${listId}-lowerBounceWrapper`}
          class={horizontal
            ? 'horizontal-end-wrapper'
            : 'vertical-end-wrapper'}
        >
          {
            // @ts-expect-error error
            bounceableProps.lowerBounceItem
          }
        </view>
      )
    }
  }
  if (
    (enableBounce
      // @ts-expect-error error
      && (bounceableProps.singleSidedBounce === 'upper'
        // @ts-expect-error error
        || bounceableProps.singleSidedBounce === 'both'))
    || enableRefresh
  ) {
    upperExposureView = (
      <list-item item-key='upperExposureView' key='upperExposureView' full-span>
        <view
          style={`display: flex; flex-direction: column; overflow:hidden; height: ${
            horizontal ? '100%' : '1ppx'
          }; width: ${horizontal ? '1ppx' : '100%'};`}
          exposure-scene={listId}
          exposure-id='upperExposureView'
          main-thread:binduidisappear={
            // @ts-expect-error error
            useRefreshAndBounceProps.onUpperDisexposure
          }
          // @ts-expect-error error
          main-thread:binduiappear={useRefreshAndBounceProps.onUpperExposure}
        />
      </list-item>
    )
  }
  if (
    enableBounce
    // @ts-expect-error error
    && (bounceableProps.singleSidedBounce === 'lower'
      // @ts-expect-error error
      || bounceableProps.singleSidedBounce === 'both')
  ) {
    lowerExposureView = (
      <list-item item-key='lowerExposureView' key='lowerExposureView' full-span>
        <view
          style={`display: flex; flex-direction: column; overflow:hidden; height: ${
            horizontal ? '100%' : '1ppx'
          }; width: ${horizontal ? '1ppx' : '100%'};`}
          exposure-scene={listId}
          exposure-id='lowerExposureView'
          main-thread:binduidisappear={
            // @ts-expect-error error
            useRefreshAndBounceProps.onLowerDisexposure
          }
          // @ts-expect-error error
          main-thread:binduiappear={useRefreshAndBounceProps.onLowerExposure}
        />
      </list-item>
    )
  }
  const finishRefresh = () => {
    if (
      enableRefresh
      && useRefreshAndBounceProps
      && useRefreshAndBounceProps.finishRefresh
    ) {
      void runOnMainThread(useRefreshAndBounceProps.finishRefresh)()
    }
  }
  const startRefreshMainThreadMethod = () => {
    'main thread'
    if (
      enableRefresh
      && useRefreshAndBounceProps
      && useRefreshAndBounceProps.startRefreshMethod
    ) {
      useRefreshAndBounceProps.startRefreshMethod()
    }
  }

  const startRefresh = () => {
    void runOnMainThread(startRefreshMainThreadMethod)()
  }

  const scrollTo = (
    animated: boolean,
    alignTo: 'bottom' | 'top' | 'middle' | 'none',
    index?: number,
    offset?: number,
    success?: (res: unknown) => void,
    fail?: (res: unknown) => void,
  ) => {
    baseListRef.current?.scrollTo(
      animated,
      alignTo,
      index,
      offset,
      success,
      fail,
    )
  }

  const scrollIntoID = (
    animated: boolean,
    alignTo: 'bottom' | 'top' | 'middle' | 'none',
    id: string,
    listItemID: string,
    index: number,
    offset?: number,
    success?: (res: unknown) => void,
    fail?: (res: unknown) => void,
  ) => {
    baseListRef.current?.scrollIntoID(
      animated,
      alignTo,
      id,
      listItemID,
      index,
      offset,
      success,
      fail,
    )
  }

  const autoScroll = (
    rate:
      | `${number}px`
      | `${number}rpx`
      | `${number}ppx`
      | `${number}rem`
      | `${number}em`
      | `${number}vw`
      | `${number}vh`,
    start: boolean,
    autoStop: boolean,
  ) => {
    baseListRef.current?.autoScroll(rate, start, autoStop)
  }

  const getVisibleCells = (
    success?: (res: unknown) => void,
    fail?: (res: unknown) => void,
  ) => {
    baseListRef.current?.getVisibleCells(success, fail)
  }

  const changeHasMoreStatus = (hasMore: boolean) => {
    setHasMoreData(hasMore)
  }
  useImperativeHandle(
    ref,
    () => ({
      finishRefresh,
      startRefresh,
      changeHasMoreStatus,
      scrollTo,
      scrollIntoID,
      autoScroll,
      getVisibleCells,
    }),
    [
      finishRefresh,
      startRefresh,
      changeHasMoreStatus,
      scrollTo,
      scrollIntoID,
      autoScroll,
      getVisibleCells,
    ],
  )

  const validBaseListProps = { ...props }
  for (const key of FeedListExcludedJSXProperties) {
    if (key in validBaseListProps) {
      delete validBaseListProps[key]
    }
  }

  // both user props and hooks props may have the same key. So we need to combine them.
  const combinedMTSPropsGenerator: (
    inputProps: FeedListProps,
    hooksProps: Record<string, unknown>,
  ) => Record<string, unknown> = (inputProps: FeedListProps, hooksProps) => {
    if (!useRefreshAndBounce) {
      return inputProps
    }
    const mainThreadRelatedEvents = [
      'main-thread:onTouchStart',
      'main-thread:onTouchEnd',
      'main-thread:onTouchMove',
      'main-thread:onLayoutChange',
      'main-thread:onScroll',
      'main-thread:onScrollEnd',
      'main-thread:onLayoutComplete',
    ]
    const combinedMTSProps = {}
    mainThreadRelatedEvents.forEach((eventName) => {
      if (inputProps[eventName] && hooksProps[eventName]) {
        combinedMTSProps[eventName] = (e) => {
          'main thread'
          // @ts-expect-error error
          hooksProps[eventName](e)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          inputProps[eventName](e)
        }
      }
    })
    return combinedMTSProps
  }

  const combinedMTSProps = combinedMTSPropsGenerator(
    { ...validBaseListProps, listId },
    useRefreshAndBounceProps as unknown as Record<string, unknown>,
  )

  function innerList() {
    return (
      <List
        {...validBaseListProps}
        {...useRefreshAndBounceProps}
        {...combinedMTSProps}
        listId={listId}
        iosEnableSimultaneousTouch={iosEnableSimultaneousTouch}
        main-thread:gesture={gesture
          ?? useRefreshAndBounceProps?.refreshAndBounceGesture}
        ref={baseListRef}
        // worklet will trigger FiberFlushElementTree and cause layout. After react 0.22.0, the element in arg0 will be empty, thus marking layout dirty from the root.
        // If the transform is not initialized, attaching it afterward will change the IsStackingContextNode() status and mark the layout as dirty for the List. This will trigger an extra layoutComplete. To avoid this, we need to initialize the transform.
        style={{ ...style, transform: 'translateY(0px)' }}
        bounces={!enableBounce && !enableRefresh && bounces}
      >
        {upperExposureView}
        {children}
        {hasMoreData ? loadMoreFooter : noMoreDataFooter}
        {lowerExposureView}
      </List>
    )
  }
  return (
    <view
      id='bounceLayout'
      flatten={false}
      style={`display: flex; flex-direction: column; overflow:hidden; height: ${
        horizontal ? '100%' : (style?.height ?? '100%')
      }; width: ${horizontal ? (style?.width ?? '100%') : '100%'};`}
    >
      {innerList()}
      {enableRefresh ? refreshHeader : startBounceView}
      {endBounceView}
    </view>
  )
}
