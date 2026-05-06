// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnBackground, useMainThreadRef } from '@lynx-js/react'
import type { ReactElement } from '@lynx-js/react'

import { NativeGesture, useGesture } from '@lynx-js/gesture-runtime'
import type { GestureChangeEvent, StateManager } from '@lynx-js/gesture-runtime'
import {
  log,
  mtsLog,
  mtsNativeLynxSDKVersionLessThan,
  selectorMT,
} from '@lynx-js/lynx-ui-common'
import type { MainThread, ScrollEvent } from '@lynx-js/types'

export interface RefreshEvent {
  triggeredBy: 'startRefresh' | 'drag'
}
export interface refreshOffsetEvent {
  offset: number
  headerSize: number
  isDragging: boolean
}
export interface headerReleased {
  offset: number
  headerSize: number
}
export interface RefreshStateChange {
  state: RefreshState
}
export interface scrollToBouncesInfo {
  direction: 'upper' | 'lower'
}

export interface BounceableBasicProps {
  enableBounces: boolean
  enableBounceEventInFling?: boolean
  startBounceTriggerDistance?: number
  endBounceTriggerDistance?: number
  upperBounceItem?: ReactElement
  lowerBounceItem?: ReactElement
  alwaysBouncing?: boolean
  singleSidedBounce?: 'upper' | 'lower' | 'both' | 'iOSBounces' | 'none'
  estimatedHeight?: number
  estimatedWidth?: number
  validAnimationVersion?: boolean
  onScrollToBounces?: (e: { direction: 'upper' | 'lower' }) => void
}

export interface RefreshProps {
  enableRefresh: boolean
  // biome-ignore lint/suspicious/noExplicitAny: expected
  headerContent: any
  validAnimationVersion?: boolean
  onStartRefresh?: (e: { triggeredBy: 'startRefresh' | 'drag' }) => void
  onRefreshOffsetChange?: (
    e: { offset: number, headerSize: number, isDragging: boolean },
  ) => void
  onRefreshStateChange?: (e: { state: number }) => void
  onHeaderReleased?: (e: { offset: number, headerSize: number }) => void
}

export enum RefreshState {
  IDLE = 0,
  OVER_DRAG_RELEASE = 1,
  REFRESHING = 2,
  DRAGGING = 3,
}

export interface useRefreshAndBounceOptions {
  refreshOptions: RefreshProps
  bounceableOptions: BounceableBasicProps
  debugLog?: boolean
  enableRTL?: boolean
  id: string
  scrollOrientation: 'vertical' | 'horizontal'
}

export interface useRefreshAndBounceReturn {
  refreshAndBounceGesture: NativeGesture
  'main-thread:onLayoutChange': (e: MainThread.LayoutChangeEvent) => void
  'main-thread:onScroll': (e: ScrollEvent) => void
  'main-thread:onLayoutComplete': () => void
  onUpperExposure: () => void
  onUpperDisexposure: () => void
  onLowerExposure: () => void
  onLowerDisexposure: () => void
  onRefreshHeaderLayoutUpdated: (e: MainThread.LayoutChangeEvent) => void
  finishRefresh: () => void
  startRefreshMethod: () => void
}

interface BouncingPositionInfo {
  [key: string]: unknown
  bouncingOffset?: number
  velocity?: number
  timeStamp?: number
}

export function useRefreshAndBounce(
  options: useRefreshAndBounceOptions,
): useRefreshAndBounceReturn {
  // Control the damping coefficient during rubber effect. The smaller it is, the harder the spring effect.
  const rubberC = useMainThreadRef(0.55)
  // Control the fling deceleration coefficient during dropdown. The smaller it is, the faster it stops.
  const flingDeceleratingRate = useMainThreadRef(0.98)
  // The rebound coefficient during bounce back, the larger it is, the faster the rebound speed.
  const beta = useMainThreadRef(15)
  // The starting point of current touch procedure
  const startTouchEvent = useMainThreadRef<GestureChangeEvent | null>(null)
  // Record the previous touch and clear it on touchEnd. If current is not empty, then it means that the scrollable object is being dragged.
  const prevTouchEvent = useMainThreadRef<GestureChangeEvent | null>(null)
  // Current scroll velocity.
  const scrollVelocity = useMainThreadRef(0)
  // Read from options
  const containerID = options.id ?? 'bounceableContainer'
  // Current bouncing position.
  const bouncingPositionInfo = useMainThreadRef<BouncingPositionInfo>({})
  // If reaches edge and bouncing starts during dragging, save the touch point and calculate later touch delta for rubberEffect.
  const startBouncingTouchEvent = useMainThreadRef<GestureChangeEvent | null>(
    null,
  )
  // If reaches edge and bouncing starts during dragging, save current bouncingPosition and continues rubberEffect's calculation from this point.
  const startTouchBouncingDelta = useMainThreadRef({})
  // when touch starts during bouncing, save current bouncingPosition and continues rubberEffect's calculation from this point.
  const bouncingTouchStartPosition = useMainThreadRef({})
  // Used to record the previous scroll position and calculate current scroll velocity.
  const prevScroll = useMainThreadRef({})
  // scroll container's basic info.
  const height = useMainThreadRef(0)
  const width = useMainThreadRef(0)
  const scrollX = useMainThreadRef(0)
  const scrollY = useMainThreadRef(0)
  // Flags for ending bouncing animation.
  const touchEndFrameEnableFlag = useMainThreadRef(false)
  const touchingEndBouncingBackEnableFlag = useMainThreadRef(false)
  const flingEndWithBouncingEnableFlag = useMainThreadRef(false)
  // Flags for reaches upper/lower edge.
  // When content's size is smaller than viewport, these two flags are both true.
  const toUpper = useMainThreadRef(false)
  const toLower = useMainThreadRef(false)
  const { enableBounces, onScrollToBounces } = options.bounceableOptions
  const debugLogEnabled = Boolean(options.debugLog)
  const alwaysBouncing = options.bounceableOptions.alwaysBouncing
    ?? options.refreshOptions.enableRefresh
    ?? false
  const scrollOrientation = options.scrollOrientation ?? 'vertical'
  const enableRTL = useMainThreadRef(options.enableRTL ?? false)
  const enableBounceEventInFling =
    options.bounceableOptions.enableBounceEventInFling
      ?? options.bounceableOptions.enableBounceEventInFling
      ?? true
  const startBounceTriggerDistance =
    options.bounceableOptions.startBounceTriggerDistance ?? 0
  const endBounceTriggerDistance =
    options.bounceableOptions.endBounceTriggerDistance ?? 0
  // Temporary workaround as requestAnimationFrame will crash below Lynx 2.15.2.
  const temporaryValidVersionCheckForRAF = useMainThreadRef(
    options.bounceableOptions.validAnimationVersion
      ?? options.refreshOptions.validAnimationVersion,
  )
  // Refresh props
  const {
    enableRefresh,
    onStartRefresh,
    onRefreshOffsetChange,
    onRefreshStateChange,
    onHeaderReleased,
  } = options.refreshOptions
  const refreshHeaderSize = useMainThreadRef<number>(0)
  log(
    debugLogEnabled,
    `[lynx-ui-feed-list][useRefresh] init, enableRefresh: ${enableRefresh}, enableBounces: ${enableBounces}, orientation: ${scrollOrientation}, enableRTL: ${
      options.enableRTL ?? false
    }`,
  )
  // While refresh released and finishRefresh not called, the bouncingBack should not be triggered.
  const isDuringRefresh = useMainThreadRef(false)
  const currentRefreshState = useMainThreadRef(RefreshState.IDLE)
  const bouncingStatus = {
    inScrollingRange: 0,
    upperBouncing: 1,
    lowerBouncing: 2,
    noBouncing: 3,
    alwaysBouncing: 4,
  }
  const bouncingBackMode = {
    resetToBoundary: 0,
    clampToHeader: 1,
  }
  function isVertical() {
    'main thread'
    return scrollOrientation === 'vertical'
  }
  function threshold() {
    'main thread'
    return 1.0 / Number(SystemInfo.pixelRatio)
  }
  function normalizedHorizontalValue(value: number) {
    'main thread'
    return enableRTL.current ? -value : value
  }
  function bouncingBackThreshold(mode: number) {
    'main thread'
    switch (mode) {
      case bouncingBackMode.resetToBoundary:
        return threshold()
      case bouncingBackMode.clampToHeader:
        return refreshHeaderSize.current + threshold()
      default:
        return threshold()
    }
  }

  function bouncingBackTargetPosition(mode: number) {
    'main thread'
    switch (mode) {
      case bouncingBackMode.resetToBoundary:
        return 0
        break
      case bouncingBackMode.clampToHeader:
        return refreshHeaderSize.current
        break
      default:
        return 0
    }
  }
  function isAndroid() {
    'main thread'
    return SystemInfo.platform === 'Android'
  }

  function isEmpty(obj: Record<string, unknown>) {
    'main thread'
    return !obj || Object.keys(obj).length === 0
  }
  function enableScroll(enable: boolean) {
    'main thread'
    // Android will trigger scroll during bouncing, cancel it while bouncing.
    // When refresh is enabled, disable scroll to avoid scroll during bouncing. Otherwise, scroll container may be scrolled during refresh process.
    if (isAndroid() || isDuringRefresh.current) {
      selectorMT(containerID)?.setAttribute('enable-scroll', enable)
    }
  }
  // Clear all temps when a touch procedure ends.
  function clearTouchInfo() {
    'main thread'
    mtsLog(
      debugLogEnabled,
      '[lynx-ui-feed-list][useRefresh] clear touch info',
    )
    startTouchEvent.current = null
    bouncingTouchStartPosition.current = 0
    prevTouchEvent.current = null
    startBouncingTouchEvent.current = null
    startTouchBouncingDelta.current = 0
  }
  // Temporary workaround as requestAnimationFrame will crash below Lynx 2.15.2.
  function customRequestAnimationFrame(animationFunc: () => void) {
    'main thread'
    if (temporaryValidVersionCheckForRAF.current) {
      requestAnimationFrame(animationFunc)
    } else {
      setTimeout(animationFunc, 8)
    }
  }

  // Calculate current touch delta based on 'startPoint'. The startPoint here should be startBouncingTouchEvent which means this bouncing effect happens during a touch procedure.
  function getCurrentDelta(event: GestureChangeEvent) {
    'main thread'
    if (startTouchEvent.current === null) {
      return 0
    }
    if (startBouncingTouchEvent.current === null) {
      return scrollOrientation === 'vertical'
        ? event.params.pageY - startTouchEvent.current.params.pageY
        : normalizedHorizontalValue(
          event.params.pageX - startTouchEvent.current.params.pageX,
        )
    } else {
      return scrollOrientation === 'vertical'
        ? event.params.pageY - startBouncingTouchEvent.current.params.pageY
        : normalizedHorizontalValue(
          event.params.pageX - startBouncingTouchEvent.current.params.pageX,
        )
    }
  }

  function onRefreshStateChangeJS(info: RefreshStateChange) {
    if (enableRefresh && onRefreshStateChange) {
      onRefreshStateChange(info)
    }
  }

  function sendRefreshStateChangeEvent(state: number) {
    'main thread'
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] refresh state change, state: ${state}`,
    )
    const refreshStateChangeInfo: RefreshStateChange = {
      state,
    }
    runOnBackground(onRefreshStateChangeJS)(refreshStateChangeInfo)
  }

  function setRefreshState(state: RefreshState) {
    'main thread'
    if (currentRefreshState.current === state) {
      return
    }
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] set refresh state, from: ${currentRefreshState.current}, to: ${state}`,
    )
    currentRefreshState.current = state
    sendRefreshStateChangeEvent(state)
  }

  function onStartRefreshJS(info: RefreshEvent) {
    if (enableRefresh && onStartRefresh) {
      onStartRefresh(info)
    }
  }

  function sendStartRefreshEvent(fromStartRefreshMethod: boolean) {
    'main thread'
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] startRefresh event, triggeredBy: ${
        fromStartRefreshMethod ? 'startRefresh' : 'drag'
      }`,
    )
    const refreshInfo: RefreshEvent = {
      triggeredBy: fromStartRefreshMethod ? 'startRefresh' : 'drag',
    }
    runOnBackground(onStartRefreshJS)(refreshInfo)
  }

  function onHeaderReleasedJS(info: headerReleased) {
    if (enableRefresh && onHeaderReleased) {
      onHeaderReleased(info)
    }
  }
  function sendHeaderReleasedEvent() {
    'main thread'
    const currentBounceOffset = Number(
      bouncingPositionInfo.current?.bouncingOffset ?? 0,
    )
    if (
      // @ts-expect-error expected
      bouncingPositionInfo.current.bouncingOffset > 0
    ) {
      if (
        // @ts-expect-error expected
        refreshHeaderSize.current < bouncingPositionInfo.current.bouncingOffset
      ) {
        setRefreshState(RefreshState.OVER_DRAG_RELEASE)
      }
      mtsLog(
        debugLogEnabled,
        `[lynx-ui-feed-list][useRefresh] header released, offset: ${currentBounceOffset}, headerSize: ${refreshHeaderSize.current}`,
      )
      const refreshReleaseInfo: headerReleased = {
        offset: currentBounceOffset,
        headerSize: refreshHeaderSize.current,
      }
      runOnBackground(onHeaderReleasedJS)(refreshReleaseInfo)
    }
  }

  function onRefreshOffsetChangeJS(info: refreshOffsetEvent) {
    if (enableRefresh && onRefreshOffsetChange) {
      onRefreshOffsetChange(info)
    }
  }

  function sendHeaderOffsetChangeEvent() {
    'main thread'
    const currentBounceOffset = bouncingPositionInfo.current.bouncingOffset ?? 0
    if (currentBounceOffset > 0) {
      const refreshOffsetChangeInfo: refreshOffsetEvent = {
        offset: currentBounceOffset,
        headerSize: refreshHeaderSize.current,
        isDragging: startTouchEvent.current !== null,
      }
      runOnBackground(onRefreshOffsetChangeJS)(refreshOffsetChangeInfo)
    }
  }

  // Key bouncing status judgement.
  function getBouncingStatus() {
    'main thread'
    const currentPosition = bouncingPositionInfo.current?.bouncingOffset ?? 0
    if (Boolean(toUpper.current) && Boolean(toLower.current)) {
      return alwaysBouncing
        ? bouncingStatus.alwaysBouncing
        : bouncingStatus.noBouncing
    }
    // upper bouncing
    const initialLayoutPosition = 0
    if (currentPosition > initialLayoutPosition) {
      return bouncingStatus.upperBouncing
    }
    // bottom bouncing
    if (currentPosition < initialLayoutPosition) {
      return bouncingStatus.lowerBouncing
    }
    return bouncingStatus.inScrollingRange
  }

  // Whether fling and bouncing back step should be triggered.
  function shouldBounceWhenTouchEnd(status: number) {
    'main thread'
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] shouldBounceWhenTouchEnd, status: ${status}`,
    )
    if (
      status === bouncingStatus.inScrollingRange
      || status === bouncingStatus.noBouncing
    ) {
      return false
    }
    if (
      status === bouncingStatus.upperBouncing
      || status === bouncingStatus.lowerBouncing
    ) {
      return true
    }
    if (status === bouncingStatus.alwaysBouncing) {
      return alwaysBouncing
    }
    return false
  }
  function releasedOverHeader() {
    'main thread'
    const currentBounceOffset = bouncingPositionInfo.current.bouncingOffset ?? 0
    if (currentBounceOffset > refreshHeaderSize.current) {
      return true
    }
  }
  function shouldBounceBackWhenRefresh(status: number) {
    'main thread'
    // If not enableRefresh, follow bounceable logic.
    if (!enableRefresh) {
      mtsLog(
        debugLogEnabled,
        '[lynx-ui-feed-list][useRefresh] shouldBounceBackWhenRefresh skipped, enableRefresh=false',
      )
      return false
    }
    const overHeader = releasedOverHeader()
    const shouldBounceBack = (
      status === bouncingStatus.upperBouncing
      || status === bouncingStatus.alwaysBouncing
    ) && Boolean(overHeader)
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] shouldBounceBackWhenRefresh, status: ${status}, releasedOverHeader: ${
        String(overHeader)
      }, result: ${String(shouldBounceBack)}`,
    )
    if (
      (status === bouncingStatus.upperBouncing
        || status === bouncingStatus.alwaysBouncing)
      && overHeader
    ) {
      return true
    }
    return false
  }
  // Use translate to implement real bouncing effect
  function bouncingSetStyle(offset: number) {
    'main thread'
    if (isNaN(Number(offset))) {
      console.error(
        '[lynx-ui-feed-list][useRefresh] ERROR! bouncingOffset is NaN',
      )
      return
    }
    // update bouncingPositionInfo first
    if (isEmpty(bouncingPositionInfo.current)) {
      bouncingPositionInfo.current.velocity = 0
    } else {
      const timeDuration = Date.now()
        - Number(bouncingPositionInfo.current.timeStamp ?? 0)
      const offsetDiff = offset
        - Number(bouncingPositionInfo.current?.bouncingOffset ?? 0)
      if (timeDuration > 0) {
        bouncingPositionInfo.current.velocity = offsetDiff / timeDuration
      }
    }
    bouncingPositionInfo.current.bouncingOffset = offset
    bouncingPositionInfo.current.timeStamp = Date.now()
    // When bouncing effect ends, clear startTouchEvent and bouncingTouchStartPosition
    if (offset === 0 && prevTouchEvent.current !== null) {
      startTouchEvent.current = prevTouchEvent.current
      bouncingTouchStartPosition.current = {}
    }
    // trigger translate
    if (isVertical()) {
      const containerTransform = `translateY(${offset}px)`
      mtsLog(
        debugLogEnabled,
        `[lynx-ui-feed-list][useRefresh] apply transform, orientation: vertical, rawOffset: ${offset}, containerTransform: ${containerTransform}`,
      )
      selectorMT(containerID)?.setStyleProperty(
        'transform',
        containerTransform,
      )
      if (enableRefresh) {
        mtsLog(
          debugLogEnabled,
          `[lynx-ui-feed-list][useRefresh] apply transform, target: refreshHeaderWrapper, transform: ${containerTransform}`,
        )
        selectorMT(`${containerID}-refreshHeaderWrapper`)?.setStyleProperty(
          'transform',
          containerTransform,
        )
      }
      mtsLog(
        debugLogEnabled,
        `[lynx-ui-feed-list][useRefresh] apply transform, target: refreshFooterWrapper, transform: ${containerTransform}`,
      )
      selectorMT(`${containerID}-refreshFooterWrapper`)?.setStyleProperty(
        'transform',
        containerTransform,
      )
      mtsLog(
        debugLogEnabled,
        `[lynx-ui-feed-list][useRefresh] apply transform, target: lowerBounceWrapper, transform: ${containerTransform}`,
      )
      selectorMT(`${containerID}-lowerBounceWrapper`)?.setStyleProperty(
        'transform',
        containerTransform,
      )
    } else {
      const visualOffset = normalizedHorizontalValue(offset)
      const containerTransform = `translateX(${visualOffset}px)`
      mtsLog(
        debugLogEnabled,
        `[lynx-ui-feed-list][useRefresh] apply transform, orientation: horizontal, rawOffset: ${offset}, enableRTL: ${
          String(enableRTL.current)
        }, visualOffset: ${visualOffset}, containerTransform: ${containerTransform}`,
      )
      selectorMT(containerID)?.setStyleProperty(
        'transform',
        containerTransform,
      )
      mtsLog(
        debugLogEnabled,
        `[lynx-ui-feed-list][useRefresh] apply transform, target: upperBounceWrapper, transform: ${containerTransform}`,
      )
      selectorMT(`${containerID}-upperBounceWrapper`)?.setStyleProperty(
        'transform',
        containerTransform,
      )
      mtsLog(
        debugLogEnabled,
        `[lynx-ui-feed-list][useRefresh] apply transform, target: lowerBounceWrapper, transform: ${containerTransform}`,
      )
      selectorMT(`${containerID}-lowerBounceWrapper`)?.setStyleProperty(
        'transform',
        containerTransform,
      )
    }
    // Send refreshOffsetChange event
    if (isVertical() && enableRefresh) {
      sendHeaderOffsetChangeEvent()
    }
  }

  function onScrollToBouncesJS(info: scrollToBouncesInfo) {
    if (enableBounces && onScrollToBounces) {
      onScrollToBounces(info)
    }
  }

  // send the scrollToBounces event
  function triggerScrollToBouncesEvent(isUpper: boolean) {
    'main thread'
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] triggerScrollToBouncesEvent, direction: ${
        isUpper ? 'upper' : 'lower'
      }`,
    )

    const info: scrollToBouncesInfo = {
      direction: isUpper ? 'upper' : 'lower',
    }
    runOnBackground(onScrollToBouncesJS)(info)
  }

  function rubberEffect(isNegative: 1 | -1, delta: number) {
    'main thread'
    const scrollViewFrameSize = isVertical() ? height.current : width.current
    // If the touchStartPosition is not zero, it means this rubber effect happens during a touch or another bouncing effect. So the real 'start delta' should be recalculated.
    const touchStartPosition = Math.abs(
      Number(
        isEmpty(startTouchBouncingDelta.current)
          ? bouncingTouchStartPosition.current
          : startTouchBouncingDelta.current,
      ),
    )
    // This deltaYForTouchStartPosition is the inverse function of rubberEffect function
    const deltaYForTouchStartPosition =
      (scrollViewFrameSize * touchStartPosition)
        / ((scrollViewFrameSize - touchStartPosition) * rubberC.current) || 0
    // Here it calculate the next touchDelta. deltaYForNextPosition = (touch point where bouncing happens + corresponding touch delta where previous bouncing position locates)
    // This isNegative is used to handle the upper/lower bounce. RubberEffect function is different in the range (-inf,0) and [0, inf). We only use the [0, inf) part.
    const deltaYForNextPosition = bouncingTouchStartPosition.current
      ? deltaYForTouchStartPosition + isNegative * delta
      : isNegative * delta
    // Real calculation. Note that we don't use the raw touchDelta for calculating, instead, we use deltaYForNextPosition.
    const rubberBandingDistance = Math.max(
      0,
      (1.0
        - 1.0
          / ((deltaYForNextPosition * rubberC.current) / scrollViewFrameSize
            + 1.0))
        * scrollViewFrameSize,
    )
    setRefreshState(RefreshState.DRAGGING)
    bouncingSetStyle(isNegative * rubberBandingDistance)
  }

  function onRefreshHeaderLayoutUpdated(event: MainThread.LayoutChangeEvent) {
    'main thread'
    refreshHeaderSize.current = isAndroid()
      ? event.params?.height
      : event.detail?.height
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] refreshHeader layout updated, headerSize: ${refreshHeaderSize.current}`,
      event.detail,
    )
  }

  function triggerRubberEffectIfCrossingEdge(event: GestureChangeEvent) {
    'main thread'
    const delta = getCurrentDelta(event) || 0
    // Crossing top range
    if (toUpper.current === true && delta > 0) {
      mtsLog(
        debugLogEnabled,
        `[lynx-ui-feed-list][useRefresh] cross upper edge, delta: ${delta}`,
      )
      enableScroll(false)
      rubberEffect(1, delta)
    }
    // Crossing bottom range
    if (toLower.current === true && delta < 0) {
      mtsLog(
        debugLogEnabled,
        `[lynx-ui-feed-list][useRefresh] cross lower edge, delta: ${delta}`,
      )
      enableScroll(false)
      rubberEffect(-1, delta)
    }
    enableScroll(true)
  }
  // return true if scrollToBounces should be sent
  function isOverTriggerDistance() {
    'main thread'
    const bouncingTop: number = bouncingPositionInfo.current.bouncingOffset ?? 0
    const triggerDistance = bouncingTop > 0
      ? startBounceTriggerDistance
      : endBounceTriggerDistance
    const delta = Math.abs(bouncingTop) - Math.abs(triggerDistance)
    const result = delta > threshold()
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] isOverTriggerDistance, offset: ${bouncingTop}, triggerDistance: ${triggerDistance}, result: ${
        String(result)
      }`,
    )
    return result
  }
  function bouncingBack(mode: number) {
    'main thread'
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] bounce back start, mode: ${mode}`,
    )
    // step3: bounce back
    const C1 = bouncingPositionInfo.current.bouncingOffset ?? 0
    const startTime = Date.now()
    const touchingEndBouncingBackFrame = () => {
      if (Boolean(touchingEndBouncingBackEnableFlag.current) === false) {
        return
      }
      const currentTime = Date.now() - startTime
      // critical damping
      const C2 = beta.current * C1
      const easedDistance = (C1 + C2 * (currentTime / 1000))
        * Math.pow(Math.E, -beta.current * (currentTime / 1000))
      bouncingSetStyle(easedDistance)
      if (Math.abs(easedDistance) < bouncingBackThreshold(mode)) {
        // Make sure it backs to targetPosition. 0 or headerSize.
        if (mode === bouncingBackMode.clampToHeader) {
          isDuringRefresh.current = true
          sendStartRefreshEvent(false)
          setRefreshState(RefreshState.REFRESHING)
        }
        bouncingSetStyle(bouncingBackTargetPosition(mode))
        if (mode === bouncingBackMode.resetToBoundary) {
          enableScroll(true)
        }
        mtsLog(
          debugLogEnabled,
          `[lynx-ui-feed-list][useRefresh] bounce back end, mode: ${mode}`,
        )
      } else {
        customRequestAnimationFrame(touchingEndBouncingBackFrame)
      }
    }
    customRequestAnimationFrame(touchingEndBouncingBackFrame)
    touchingEndBouncingBackEnableFlag.current = true
  }
  // bindtouchstart. Save startTouchEvent and bouncingPosition if a bouncing effect is happening.
  function bounceableTouchStart(event: GestureChangeEvent) {
    'main thread'
    startTouchEvent.current = event
    prevTouchEvent.current = event
    mtsLog(debugLogEnabled, '[lynx-ui-feed-list][useRefresh] touch start')

    bouncingTouchStartPosition.current =
      bouncingPositionInfo.current?.bouncingOffset ?? 0
    // reset all animation flags. No animation should play during a touch.
    touchEndFrameEnableFlag.current = false
    touchingEndBouncingBackEnableFlag.current = false
    flingEndWithBouncingEnableFlag.current = false
  }

  function bounceableTouchMove(event: GestureChangeEvent) {
    'main thread'
    if (startTouchEvent.current === null) {
      // It means current situation is illegal. A touchMove event happens without a touchStart event beforehand. Or a touchMove event happens after a touchEnd event.
      console.error('[lynx-ui-feed-list][useRefresh] ERROR! touch not started')
      return
    }
    prevTouchEvent.current = event
    const delta = getCurrentDelta(event)
    const currentBouncingStatus = getBouncingStatus()
    // Judge the status and trigger rubberEffect. The TouchMove should only consider rubberEffect and nothing else.
    switch (currentBouncingStatus) {
      case bouncingStatus.upperBouncing: {
        enableScroll(false)
        rubberEffect(1, delta)
        break
      }
      case bouncingStatus.lowerBouncing: {
        enableScroll(false)
        rubberEffect(-1, delta)
        break
      }
      case bouncingStatus.alwaysBouncing: {
        if (alwaysBouncing) {
          triggerRubberEffectIfCrossingEdge(event)
        }
        break
      }
      case bouncingStatus.inScrollingRange: {
        triggerRubberEffectIfCrossingEdge(event)
        break
      }
      default:
        break
    }
  }
  function bouncingBackEntrance(mode: number) {
    'main thread'
    const startTime = Date.now()
    const dragEndVelocity = bouncingPositionInfo.current?.velocity ?? 0
    const dragEndPosition = bouncingPositionInfo.current?.bouncingOffset ?? 0
    // Send scrolltobounces event.
    const overTriggerDistance = isOverTriggerDistance()
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] bouncingBackEntrance, mode: ${mode}, dragEndVelocity: ${dragEndVelocity}, dragEndPosition: ${dragEndPosition}, overTriggerDistance: ${
        String(overTriggerDistance)
      }`,
    )
    if (overTriggerDistance) {
      const currentBounceOffset = bouncingPositionInfo.current?.bouncingOffset
        ?? 0
      triggerScrollToBouncesEvent(
        currentBounceOffset > 0,
      )
    }

    let currentVelocity: number = dragEndVelocity
    const touchEndProcessFrame = () => {
      if (Boolean(touchEndFrameEnableFlag.current) === false) {
        return
      }
      if (Math.abs(currentVelocity) <= threshold()) {
        // If the velocity is already under threshold, skip fling and start step3: bounce back.
        bouncingBack(mode)
      } else {
        // If the drag end with a velocity, start fling to consume it.
        // step 2: fling down
        mtsLog(
          debugLogEnabled,
          `[lynx-ui-feed-list][useRefresh] fling down start, mode: ${mode}, velocity: ${currentVelocity}`,
        )
        // This function is obtained by integrating the velocity function with a deceleration rate of flingDeceleratingRate.

        const distance: number = dragEndPosition
          + (dragEndVelocity
              * (Math.pow(flingDeceleratingRate.current, Date.now() - startTime)
                - 1))
            / Math.log(flingDeceleratingRate.current)
        bouncingSetStyle(distance)
        currentVelocity = dragEndVelocity
          * Math.pow(flingDeceleratingRate.current, Date.now() - startTime)
        if (touchEndFrameEnableFlag.current) {
          customRequestAnimationFrame(touchEndProcessFrame)
        }
      }
    }
    customRequestAnimationFrame(touchEndProcessFrame)
    touchEndFrameEnableFlag.current = true
  }
  // bindtouchend. In touchEnd event the fling forward animation and bouncingBack animation should be triggered if necessary.
  function bounceableTouchEnd() {
    'main thread'
    if (enableRefresh) {
      sendHeaderReleasedEvent()
    }
    // Reset the state. The touch information should be reset, and we should no longer ban the enable-scroll.
    clearTouchInfo()
    enableScroll(true)
    const currentStatus = getBouncingStatus()
    const shouldBounceBackForRefresh = shouldBounceBackWhenRefresh(
      currentStatus,
    )
    const shouldBounce = shouldBounceWhenTouchEnd(currentStatus)
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] touch end, status: ${currentStatus}, shouldBounceBackForRefresh: ${
        String(shouldBounceBackForRefresh)
      }, shouldBounce: ${String(shouldBounce)}`,
    )
    if (shouldBounceBackForRefresh) {
      bouncingBackEntrance(bouncingBackMode.clampToHeader)
    } else if (
      shouldBounce
      && !shouldBounceBackForRefresh
    ) {
      bouncingBackEntrance(bouncingBackMode.resetToBoundary)
    }
  }
  // Save the bindscroll info and calculate velocity.
  function bounceableHandleScroll(event: ScrollEvent) {
    'main thread'
    scrollX.current = event.detail.scrollLeft
    scrollY.current = event.detail.scrollTop
    if (!isEmpty(prevScroll.current)) {
      const prev = prevScroll.current as {
        timestamp: number
        detail: { scrollTop: number, scrollLeft: number }
      }
      const timeDuration = Date.now() - prev.timestamp
      if (timeDuration > 0) {
        const delta = isVertical()
          ? event.detail.scrollTop - prev.detail.scrollTop
          : event.detail.scrollLeft - prev.detail.scrollLeft
        const velocity = delta / timeDuration
        if (Number.isFinite(velocity)) {
          scrollVelocity.current = velocity
        }
      }
    }
    const prev = prevScroll.current as {
      timestamp?: number
      detail?: { scrollTop?: number, scrollLeft?: number }
    }
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] handle scroll near edge, scrollLeft: ${event.detail.scrollLeft}, scrollTop: ${event.detail.scrollTop}, velocity: ${scrollVelocity.current}, prevTimestamp: ${
        String(prev?.timestamp)
      }, prevScrollLeft: ${String(prev?.detail?.scrollLeft)}, prevScrollTop: ${
        String(prev?.detail?.scrollTop)
      }`,
    )
    prevScroll.current = event
  }

  function finishRefresh() {
    'main thread'
    if (enableRefresh) {
      mtsLog(
        debugLogEnabled,
        '[lynx-ui-feed-list][useRefresh] finishRefresh called',
      )
      isDuringRefresh.current = false
      bouncingBack(bouncingBackMode.resetToBoundary)
      setRefreshState(RefreshState.IDLE)
    }
  }

  function startRefreshMethod() {
    'main thread'
    if (enableRefresh) {
      mtsLog(
        debugLogEnabled,
        '[lynx-ui-feed-list][useRefresh] startRefreshMethod called',
      )
      isDuringRefresh.current = true
      const scrollToZero = selectorMT(containerID)
        ?.invoke('scrollToPosition', {
          position: 0,
          smooth: false,
          alignTo: 'top',
          useScroller: true,
        })
      // Before startRefresh method, force the List to scroll to top.
      void scrollToZero?.then(() => {
        mtsLog(
          debugLogEnabled,
          '[lynx-ui-feed-list][useRefresh] startRefreshMethod scrollToPosition resolved',
        )
        bouncingSetStyle(refreshHeaderSize.current)
        setRefreshState(RefreshState.OVER_DRAG_RELEASE)
        sendStartRefreshEvent(true)
      })
    }
  }

  function handleBounceEventInFling(edge: 'upper' | 'lower') {
    'main thread'
    // reaches edge during fling
    const startVelocity = scrollVelocity.current
    let currentVelocity = startVelocity
    const startTime = Date.now()
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] fling to edge start, edge: ${edge}, velocity: ${startVelocity}`,
    )
    let sentScrollToBouncesEvent = false // only sent scrollToBounces once
    const flingEndWithBouncingFrame = () => {
      if (Boolean(flingEndWithBouncingEnableFlag.current) === false) {
        mtsLog(
          debugLogEnabled,
          '[lynx-ui-feed-list][useRefresh] fling to edge cancelled before completion',
        )
        return
      }
      if (Math.abs(currentVelocity) <= threshold()) {
        flingEndWithBouncingEnableFlag.current = false
        mtsLog(
          debugLogEnabled,
          '[lynx-ui-feed-list][useRefresh] fling to edge end, bouncing back starts',
        )
        bouncingBack(bouncingBackMode.resetToBoundary)
      } else {
        // step 1: fling
        const distance = (currentVelocity
          * (Math.pow(flingDeceleratingRate.current, Date.now() - startTime)
            - 1))
          / Math.log(flingDeceleratingRate.current)
        const flingOffset = !isVertical() && enableRTL.current
          ? -distance
          : distance
        mtsLog(
          debugLogEnabled,
          `[lynx-ui-feed-list][useRefresh] fling frame, edge: ${edge}, currentVelocity: ${currentVelocity}, distance: ${distance}, enableRTL: ${
            String(enableRTL.current)
          }, appliedOffset: ${flingOffset}`,
        )
        bouncingSetStyle(-distance)
        if (!sentScrollToBouncesEvent && isOverTriggerDistance()) {
          mtsLog(
            debugLogEnabled,
            '[lynx-ui-feed-list][useRefresh] fling to edge reached trigger distance, emitting scrollToBounces',
          )
          triggerScrollToBouncesEvent(edge === 'upper')
          sentScrollToBouncesEvent = true
        }
        currentVelocity = startVelocity
          * Math.pow(flingDeceleratingRate.current, Date.now() - startTime)
        if (flingEndWithBouncingEnableFlag.current) {
          customRequestAnimationFrame(flingEndWithBouncingFrame)
        }
      }
    }
    customRequestAnimationFrame(flingEndWithBouncingFrame)
    flingEndWithBouncingEnableFlag.current = true
  }

  function onUpperDisexposure() {
    'main thread'
    mtsLog(
      debugLogEnabled,
      '[lynx-ui-feed-list][useRefresh] upper disexposure',
    )
    toUpper.current = false
  }
  // Handle scrolltoupper event.
  function onUpperExposure() {
    'main thread'
    mtsLog(
      debugLogEnabled,
      '[lynx-ui-feed-list][useRefresh] upper exposure',
    )
    toUpper.current = true
    if (prevTouchEvent.current) {
      mtsLog(
        debugLogEnabled,
        '[lynx-ui-feed-list][useRefresh] upper exposure during dragging',
      )
      // reaches edge during dragging
      startBouncingTouchEvent.current = prevTouchEvent.current

      startTouchBouncingDelta.current =
        bouncingPositionInfo.current?.bouncingOffset ?? 0
    } else if (
      enableBounceEventInFling
      && Math.abs(scrollVelocity.current) > threshold()
    ) {
      mtsLog(
        debugLogEnabled,
        `[lynx-ui-feed-list][useRefresh] upper exposure during fling, velocity: ${scrollVelocity.current}`,
      )
      handleBounceEventInFling('upper')
    }
    // clear scrollVelocity once it is consumed when scroll container reaches the edge.
    scrollVelocity.current = 0
  }

  function onLowerDisexposure() {
    'main thread'
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] lower disexposure, velocity: ${scrollVelocity.current}`,
    )
    toLower.current = false
  }
  function onLowerExposure() {
    'main thread'
    mtsLog(
      debugLogEnabled,
      '[lynx-ui-feed-list][useRefresh] lower exposure',
    )
    toLower.current = true
    // reaches lower during dragging
    if (prevTouchEvent.current) {
      mtsLog(
        debugLogEnabled,
        '[lynx-ui-feed-list][useRefresh] lower exposure during dragging',
      )
      // reaches lower during dragging
      startBouncingTouchEvent.current = prevTouchEvent.current

      startTouchBouncingDelta.current =
        bouncingPositionInfo.current?.bouncingOffset ?? 0
    } else if (
      enableBounceEventInFling
      && scrollVelocity.current > threshold()
    ) {
      mtsLog(
        debugLogEnabled,
        `[lynx-ui-feed-list][useRefresh] lower exposure during fling, velocity: ${scrollVelocity.current}`,
      )
      handleBounceEventInFling('lower')
    }
    // clear scrollVelocity once it is consumed when scroll container reaches the edge.
    scrollVelocity.current = 0
  }

  function bounceableLayoutComplete() {
    'main thread'
    mtsLog(
      debugLogEnabled,
      '[lynx-ui-feed-list][useRefresh] layout complete',
    )
    clearTouchInfo()
  }

  // Used to get the size of scroll container.
  function bounceableLayoutChange(event: MainThread.LayoutChangeEvent) {
    'main thread'
    height.current = (isAndroid() ? event.params?.height : event.detail?.height)
      ?? 0
    width.current = (isAndroid() ? event.params?.width : event.detail?.width)
      ?? 0
    mtsLog(
      debugLogEnabled,
      `[lynx-ui-feed-list][useRefresh] layout change, width: ${width.current}, height: ${height.current}`,
    )
  }

  const isHorizontalTouchMove = (event: GestureChangeEvent) => {
    'main thread'
    if (!prevTouchEvent.current) {
      return
    }
    const absDeltaX = Math.abs(
      event.params.clientX - prevTouchEvent.current.params.clientX,
    )
    const absDeltaY = Math.abs(
      event.params.clientY - prevTouchEvent.current.params.clientY,
    )
    if (absDeltaX > absDeltaY) {
      return true
    }
    return false
  }

  const refreshAndBounceGesture: NativeGesture = useGesture(NativeGesture)
  const isFirstJudge = useMainThreadRef(true)
  refreshAndBounceGesture.onBegin(
    (event: GestureChangeEvent, gestureManager: StateManager) => {
      'main thread'
      isFirstJudge.current = true
      mtsLog(
        debugLogEnabled,
        '[lynx-ui-feed-list][useRefresh] gesture begin',
      )
      bounceableTouchStart(event)
      if (mtsNativeLynxSDKVersionLessThan('3.3')) {
        mtsLog(
          debugLogEnabled,
          '[lynx-ui-feed-list][useRefresh] gesture begin consumeGesture(true) for sdk < 3.3',
        )
        gestureManager.consumeGesture(true)
      }
    },
  )

  refreshAndBounceGesture.onEnd(() => {
    'main thread'
    isFirstJudge.current = true
    mtsLog(
      debugLogEnabled,
      '[lynx-ui-feed-list][useRefresh] gesture end',
    )
    bounceableTouchEnd()
  })

  // If the gesture was canceled by outside, we need to trigger same logic here.
  refreshAndBounceGesture.onTouchesCancel(() => {
    'main thread'
    isFirstJudge.current = true
    mtsLog(
      debugLogEnabled,
      '[lynx-ui-feed-list][useRefresh] gesture cancel',
    )
    bounceableTouchEnd()
  })

  refreshAndBounceGesture.onUpdate(
    (event: GestureChangeEvent, gestureManager) => {
      'main thread'
      // We only judge the first update in single touch.
      // Refresh only consume vertical touch move.
      if (
        enableRefresh
        || (enableBounces && scrollOrientation === 'vertical')
      ) {
        // Refresh only consume vertical touch move.
        if (isFirstJudge.current) {
          if (mtsNativeLynxSDKVersionLessThan('3.3')) {
            if (isHorizontalTouchMove(event)) {
              mtsLog(
                debugLogEnabled,
                '[lynx-ui-feed-list][useRefresh] gesture first judge, vertical mode, horizontal move detected, end gesture',
              )
              gestureManager.consumeGesture(false)
              gestureManager.end()
            } else {
              mtsLog(
                debugLogEnabled,
                '[lynx-ui-feed-list][useRefresh] gesture first judge, vertical mode, consume gesture',
              )
              gestureManager.consumeGesture(true)
            }
          } else {
            const deltaY = prevTouchEvent.current
              ? event.params.clientY - prevTouchEvent.current.params.clientY
              : 0
            if (
              !isHorizontalTouchMove(event) && toUpper.current && deltaY > 0
            ) {
              mtsLog(
                debugLogEnabled,
                '[lynx-ui-feed-list][useRefresh] gesture first judge, vertical mode, intercept gesture',
              )
              gestureManager.interceptGesture(true)
            } else {
              mtsLog(
                debugLogEnabled,
                '[lynx-ui-feed-list][useRefresh] gesture first judge, vertical mode, do not intercept gesture',
              )
              gestureManager.interceptGesture(false)
            }
          }
        } else {
          if (!isHorizontalTouchMove(event)) {
            bounceableTouchMove(event)
          }
        }
      } else if (enableBounces && scrollOrientation === 'horizontal') {
        if (mtsNativeLynxSDKVersionLessThan('3.3')) {
          if (isFirstJudge.current) {
            if (isHorizontalTouchMove(event)) {
              mtsLog(
                debugLogEnabled,
                '[lynx-ui-feed-list][useRefresh] gesture first judge, horizontal mode, consume gesture',
              )
              gestureManager.consumeGesture(true)
            } else {
              mtsLog(
                debugLogEnabled,
                '[lynx-ui-feed-list][useRefresh] gesture first judge, horizontal mode, vertical move detected, end gesture',
              )
              gestureManager.consumeGesture(false)
              gestureManager.end()
            }
          } else {
            if (isHorizontalTouchMove(event)) {
              bounceableTouchMove(event)
            }
          }
        } else {
          if (isHorizontalTouchMove(event)) {
            mtsLog(
              debugLogEnabled,
              '[lynx-ui-feed-list][useRefresh] gesture horizontal mode, interceptGesture(false) and handle touch move',
            )
            gestureManager.interceptGesture(false)
            bounceableTouchMove(event)
          }
        }
      }
      prevTouchEvent.current = event
      isFirstJudge.current = false
    },
  )

  return {
    refreshAndBounceGesture,
    'main-thread:onLayoutChange': bounceableLayoutChange,
    'main-thread:onScroll': bounceableHandleScroll,
    'main-thread:onLayoutComplete': bounceableLayoutComplete,
    onUpperExposure,
    onUpperDisexposure,
    onLowerExposure,
    onLowerDisexposure,
    onRefreshHeaderLayoutUpdated,
    finishRefresh,
    startRefreshMethod,
  }
}
