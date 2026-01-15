// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  forwardRef,
  memo,
  runOnMainThread,
  useImperativeHandle,
  useMainThreadRef,
  useRef,
} from '@lynx-js/react'
import type { ForwardedRef } from '@lynx-js/react'

import {
  ExposureEventsMapping,
  LayoutEventsMapping,
  ScrollEventsMapping,
  TouchEventsMapping,
  useRegisteredEvents,
} from '@lynx-js/lynx-ui-common'
import type { MainThread } from '@lynx-js/types'

import '@lynx-js/gesture-runtime'

import type { ListProps, ListRef, List as ListType } from './types'
import { useMaxSize } from './useMaxSize.jsx'

export type { ListRef, ListProps }

export const List = memo(forwardRef(ListImpl)) as ListType

const ListExcludedJSXProperties: string[] = ['children']

export const ListEventMapping: Record<string, string> = {
  onLayoutComplete: 'bindlayoutcomplete',
  onScrollStateChange: 'bindscrollstatechange',
  onSnapToItem: 'bindsnap',
}

enum DEBUG_LEVEL {
  None = 0,
  Error = 1,
  Info = 2,
  Verbose = 3,
}

/**
 * @example
 * ```javascript
 * <List
        style={{ width: '100vw', height: listSize }}
        ref={listRef}
        listType="single"
        spanCount={1}
        scrollOrientation={orientation}
        useRefactorList={true}
      >
        {data.map((value, index) => (
          <list-item
            item-key={value.toString()}
            id={value.toString()}
            key={value.toString()}
          >
            <view
              style={{
                width: orientation === 'vertical' ? '100vw' : listSize,
                height: orientation === 'vertical' ? '400px' : listSize,
                borderWidth: '2px',
                borderColor: 'red',
              }}
            >
              <text>{value.toString()}</text>
              <view
                style="width:100vw; height:200px;background-color:green"
                id={`inner${value.toString()}`}
              />
            </view>
          </list-item>
        ))}
      </List>
 * ```
 */

function ListImpl(props: ListProps, ref: ForwardedRef<ListRef>) {
  const {
    scrollOrientation = 'vertical',
    children,
    debugLogLevel = DEBUG_LEVEL.None,
    needLayoutCompleteInfo = false,
    enableScroll = true,
    crossAxisGap = 0,
    mainAxisGap = 0,
    enableScrollBar,
    exposureID,
    exposureScene,
    iosEnableSimultaneousTouch = true,
    shouldRequestStateRestore = false,
    enableScrollMonitor = false,
    scrollMonitorTag,
    name,
    listType,
    spanCount,
    style,
    className,
    useRefactorList = true,
    scrollPropagationBehavior = 'native',
    temporaryBlockScrollClass = 'BDXLynxViewPager',
    temporaryBlockScrollTag = 0,
    scrollEventThrottle = 200,
    itemSnap,
    preloadBufferCount = 0,
    listMaxSize,
    temporaryAndroidEnableOverflow = true,
    'main-thread:gesture': gesture,
    // @ts-expect-error Expected
    'main-thread:onLayoutChange': MTOnLayoutChange,
  } = props
  // exclude jsx properties from base props
  const legalBaseProps = { ...props }
  for (const key of ListExcludedJSXProperties) {
    if (key in legalBaseProps) {
      delete legalBaseProps[key]
    }
  }
  const listMainThreadRef = useMainThreadRef<MainThread.Element>(null)

  // generates binding events dynamically
  const listRegisteredEvents = useRef<Record<string, string>>({
    ...ScrollEventsMapping,
    ...ExposureEventsMapping,
    ...TouchEventsMapping,
    ...LayoutEventsMapping,
    ...ListEventMapping,
  })
  const registerEvents = useRegisteredEvents(
    legalBaseProps,
    listRegisteredEvents.current,
  )
  const listId = props.listId || 'list'
  const listWidth = useMainThreadRef(0)
  const listHeight = useMainThreadRef(0)
  const scrollTo = (
    animated: boolean,
    alignTo: 'bottom' | 'top' | 'middle' | 'none',
    index?: number,
    offset?: number,
    success?: (res: unknown) => void,
    fail?: (res: unknown) => void,
  ) => {
    if (debugLogLevel > 0) {
      console.info(
        'scrollTo',
        Boolean(lynx.createSelectorQuery().select(`#${listId}`)),
        `#${listId}`,
      )
    }
    lynx
      .createSelectorQuery()
      .select(`#${listId}`)
      .invoke({
        method: 'scrollToPosition',
        params: {
          position: index,
          index,
          smooth: animated,
          offset,
          alignTo,
          useScroller: true,
        },
        success(res) {
          success?.(res)
        },
        fail(res) {
          fail?.(res)
        },
      })
      .exec()
  }

  const calculateScrollToPositionOffset = (
    listSize: number,
    alignTo: 'bottom' | 'top' | 'middle' | 'none',
    targetOriginUpper: number,
    targetOriginLower: number,
    _listItemSize: number,
    idItemSize: number,
  ) => {
    'main thread'
    if (alignTo === 'bottom') {
      return targetOriginLower - listSize
    }
    if (alignTo === 'top') {
      return targetOriginUpper
    }
    if (alignTo === 'middle') {
      const distanceFromTop = (listSize - idItemSize) / 2
      return targetOriginUpper - distanceFromTop
    }

    return 0
  }

  const scrollToIDInner = (
    animated: boolean,
    alignTo: 'bottom' | 'top' | 'middle' | 'none',
    id: string,
    listItemID: string,
    index: number,
    _offset?: number,
    _success?: (res: unknown) => void,
    _fail?: (res: unknown) => void,
  ) => {
    'main thread'
    if (debugLogLevel > DEBUG_LEVEL.Info) {
      console.info('scrollToIDInner', id, listItemID, listId)
    }

    // first step: scrollTo target index
    const handleScrollToPositionIndex = lynx
      .querySelector(`#${listId}`)
      ?.invoke('scrollToPosition', {
        position: index,
        smooth: animated,
        alignTo: 'top',
        useScroller: true,
      })
    void handleScrollToPositionIndex?.then(() => {
      if (debugLogLevel >= DEBUG_LEVEL.Info) {
        console.info('handleScrollToPositionIndex', 'success')
      }
      // second step: get the bounding client rect of the element with the specified ID.
      const handleBoundingClientRect = lynx
        .querySelector(`#${id}`)
        ?.invoke('boundingClientRect', { relativeTo: listItemID })
      void handleBoundingClientRect?.then(
        (res: {
          top: number
          left: number
          bottom: number
          right: number
          height: number
          width: number
        }) => {
          const relativeUpper = scrollOrientation === 'vertical'
            ? res.top
            : res.left
          const relativeLower = scrollOrientation === 'vertical'
            ? res.bottom
            : res.right
          const idItemSize = scrollOrientation === 'vertical'
            ? res?.height
            : res.width
          const listSize = scrollOrientation === 'vertical'
            ? listHeight.current
            : listWidth.current
          if (debugLogLevel >= DEBUG_LEVEL.Verbose) {
            console.info(
              'handleBoundingClientRect',
              relativeUpper,
              relativeLower,
              listSize,
              idItemSize,
            )
            console.info(
              'positionOffset',
              calculateScrollToPositionOffset(
                Number(listSize),
                alignTo,
                relativeUpper,
                relativeLower,
                0,
                idItemSize,
              ),
            )
          }
          // third step: scroll to the target offset and adjust alignment
          void lynx.querySelector(`#${listId}`)?.invoke('scrollToPosition', {
            position: index,
            offset: -calculateScrollToPositionOffset(
              Number(listSize),
              alignTo,
              relativeUpper,
              relativeLower,
              0,
              idItemSize,
            ),
            smooth: animated,
            useScroller: true,
            alignTo: 'top',
          })
        },
      )
    })
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
    if (debugLogLevel > DEBUG_LEVEL.Info) {
      console.info('scrollIntoID')
    }
    runOnMainThread(scrollToIDInner)(
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
    if (debugLogLevel > DEBUG_LEVEL.None) {
      console.info('autoScroll')
    }
    lynx
      .createSelectorQuery()
      .select(`#${listId}`)
      .invoke({
        method: 'autoScroll',
        params: {
          rate,
          start,
          autoStop,
        },
      })
      .exec()
  }

  const getVisibleCells = (
    success?: (res: unknown) => void,
    fail?: (res: unknown) => void,
  ) => {
    if (debugLogLevel > DEBUG_LEVEL.None) {
      console.info('getVisibleCells')
    }
    lynx
      .createSelectorQuery()
      .select(`#${listId}`)
      .invoke({
        // @ts-expected-error Error
        method: 'getVisibleCells',
        success(res) {
          success?.(res)
        },
        fail(res) {
          fail?.(res)
        },
      })
      .exec()
  }

  const handleMaxSize = useMaxSize(
    scrollOrientation,
    scrollOrientation === 'vertical' ? listHeight : listWidth,
    listMaxSize,
    listMainThreadRef,
  )

  useImperativeHandle(
    ref,
    () => ({
      scrollTo,
      scrollIntoID,
      autoScroll,
      getVisibleCells,
    }),
    [scrollTo, scrollIntoID, autoScroll, getVisibleCells],
  )

  const exposureProps = []
  if (exposureID) {
    // @ts-expect-error error
    exposureProps.push({
      'exposure-id': exposureID,
    })
  }
  if (exposureScene) {
    // @ts-expect-error error
    exposureProps.push({
      'exposure-scene': exposureScene,
    })
  }

  const shouldEnableNested = () => {
    if (
      SystemInfo.platform === 'iOS'
      && scrollPropagationBehavior !== 'propagate'
    ) {
      return false
    }
    return true
  }

  return (
    <list
      style={{
        ...style,
        listMainAxisGap: `${mainAxisGap.toString()}px`,
        // @ts-expect-error error
        // listCrossAxisGap is temporarily missing in ReactLynx lib
        listCrossAxisGap: `${crossAxisGap.toString()}px`,
        display: 'linear',
        linearOrientation: scrollOrientation,
        ...(listMaxSize
          ? (scrollOrientation === 'horizontal'
            ? { width: `${listMaxSize}px` }
            : { height: `${listMaxSize}px` })
          : {}),
      }}
      main-thread:ref={listMainThreadRef}
      className={className}
      id={props.listId ?? 'list'}
      name={name}
      list-type={spanCount === 1 ? 'single' : listType ?? 'single'}
      {...registerEvents}
      {...exposureProps}
      bounces={props.bounces}
      enable-scroll={enableScroll}
      vertical-orientation={scrollOrientation === 'vertical'}
      column-count={listType === 'single' ? 1 : spanCount ?? 1}
      scroll-orientation={scrollOrientation}
      scroll-bar-enable={enableScrollBar}
      ios-enable-simultaneous-touch={iosEnableSimultaneousTouch}
      android-enable-gap-item-decoration={true}
      list-main-axis-gap={mainAxisGap}
      list-cross-axis-gap={crossAxisGap}
      sticky-offset={props.stickyOffset}
      sticky={true}
      initial-scroll-index={props.initialScrollIndex}
      needs-visible-cells={props.showVisibleItemInfoInScrollEvent}
      lower-threshold-item-count={props.lowerThresholdItemCount}
      upper-threshold-item-count={props.upperThresholdItemCount}
      experimental-disable-platform-implementation={useRefactorList}
      custom-list-name={useRefactorList ? 'list-container' : 'list'}
      ios-fixed-content-offset={true}
      preload-buffer-count={preloadBufferCount}
      need-layout-complete-info={needLayoutCompleteInfo
        || (listMaxSize && listMaxSize > 0)}
      force-can-scroll={scrollPropagationBehavior === 'preventPropagate'}
      ios-block-gesture-class={scrollPropagationBehavior === 'preventPropagate'
        ? temporaryBlockScrollClass
        : ''}
      ios-recognized-view-tag={scrollPropagationBehavior === 'preventPropagate'
        ? temporaryBlockScrollTag
        : 0}
      enable-nested-scroll={shouldEnableNested()}
      internal-cell-appear-notification={shouldRequestStateRestore}
      internal-cell-disappear-notification={shouldRequestStateRestore}
      internal-cell-prepare-for-reuse-notification={shouldRequestStateRestore}
      should-request-state-restore={shouldRequestStateRestore}
      scroll-event-throttle={scrollEventThrottle}
      enable-scroll-monitor={enableScrollMonitor}
      scroll-monitor-tag={scrollMonitorTag}
      android-enable-overflow={temporaryAndroidEnableOverflow}
      main-thread:bindlayoutcomplete={handleMaxSize
        ?.handleLayoutCompleted}
      main-thread:bindlayoutchange={(e) => {
        'main thread'
        if (typeof MTOnLayoutChange === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          MTOnLayoutChange(e)
        }
        listHeight.current = SystemInfo.platform === 'Android'
          ? e.params?.height
          : e.detail.height
        listWidth.current = SystemInfo.platform === 'Android'
          ? e.params?.width
          : e.detail.width
      }}
      main-thread:gesture={gesture}
      {...(itemSnap ? { 'item-snap': itemSnap } : {})}
    >
      {children}
    </list>
  )
}
