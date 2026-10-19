// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnBackground, useMainThreadRef } from '@lynx-js/react'

import { mtsLog, selectorMT } from '@lynx-js/lynx-ui-common'
import type { CommonEvent, ScrollEvent } from '@lynx-js/types'

import type { BounceableBasicProps, ScrollToBouncesInfo } from '../types'
import { getNativeBounceMetricsMT } from './nativeBounceUtils'

interface UseNativeBounceOptions {
  bounceableOptions: BounceableBasicProps
  debugLog?: boolean
  enableRTL?: boolean
  id?: string
  scrollOrientation: 'vertical' | 'horizontal'
}

interface NativeBounceHandlers {
  'main-thread:bindlayoutchange': (event: CommonEvent) => void
  'main-thread:bindscroll': (event: ScrollEvent) => void
  'main-thread:bindscrollend': (event: ScrollEvent) => void
}

export function useNativeBounce(
  options: UseNativeBounceOptions,
): NativeBounceHandlers {
  const containerID = options.id ?? 'bounceableContainer'
  const isVertical = options.scrollOrientation === 'vertical'
  const enableRTL = options.enableRTL ?? false
  const debugLogEnabled = Boolean(options.debugLog)
  const height = useMainThreadRef(
    options.bounceableOptions.estimatedHeight ?? 0,
  )
  const width = useMainThreadRef(
    options.bounceableOptions.estimatedWidth ?? 0,
  )
  const maxUpperDistance = useMainThreadRef(0)
  const maxLowerDistance = useMainThreadRef(0)
  const lastBounceDirection = useMainThreadRef<'upper' | 'lower' | null>(null)

  const singleSidedBounce = options.bounceableOptions.singleSidedBounce
    ?? 'both'
  const enableUpper = singleSidedBounce === 'upper'
    || singleSidedBounce === 'both'
    || singleSidedBounce === 'iOSBounces'
  const enableLower = singleSidedBounce === 'lower'
    || singleSidedBounce === 'both'
    || singleSidedBounce === 'iOSBounces'

  function setBounceViewOffset(upperDistance: number, lowerDistance: number) {
    'main thread'
    if (isVertical) {
      selectorMT(`${containerID}-upperBounceWrapper`)?.setStyleProperty(
        'transform',
        `translateY(${upperDistance}px)`,
      )
      selectorMT(`${containerID}-lowerBounceWrapper`)?.setStyleProperty(
        'transform',
        `translateY(${-lowerDistance}px)`,
      )
    } else {
      const direction = enableRTL ? -1 : 1
      selectorMT(`${containerID}-upperBounceWrapper`)?.setStyleProperty(
        'transform',
        `translateX(${direction * upperDistance}px)`,
      )
      selectorMT(`${containerID}-lowerBounceWrapper`)?.setStyleProperty(
        'transform',
        `translateX(${-direction * lowerDistance}px)`,
      )
    }
  }

  function onScrollToBouncesJS(info: ScrollToBouncesInfo) {
    options.bounceableOptions.onScrollToBounces?.(info)
  }

  function nativeBounceLayoutChange(event: CommonEvent) {
    'main thread'
    const isAndroid = SystemInfo.platform === 'Android'
    // @ts-expect-error Expected
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    height.current = (isAndroid ? event.params?.height : event.detail?.height)
      ?? 0
    // @ts-expect-error Expected
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    width.current = (isAndroid ? event.params?.width : event.detail?.width) ?? 0

    mtsLog(
      debugLogEnabled,
      `[lynx-ui-scroll-view][useNativeBounce] layout change, height: ${height.current}, width: ${width.current}`,
    )
  }

  function nativeBounceScroll(event: ScrollEvent) {
    'main thread'
    const offset = isVertical
      ? event.detail.scrollTop
      : event.detail.scrollLeft
    const scrollSize = isVertical
      ? event.detail.scrollHeight
      : event.detail.scrollWidth
    const viewportSize = isVertical ? height.current : width.current
    const {
      maxScrollOffset,
      upperDistance,
      lowerDistance,
    } = getNativeBounceMetricsMT(
      offset,
      scrollSize,
      viewportSize,
      enableUpper,
      enableLower,
    )

    mtsLog(
      debugLogEnabled,
      `[lynx-ui-scroll-view][useNativeBounce] scroll, offset: ${offset}, scrollSize: ${scrollSize}, viewportSize: ${viewportSize}, maxScrollOffset: ${maxScrollOffset}, upperDistance: ${upperDistance}, lowerDistance: ${lowerDistance}`,
    )

    setBounceViewOffset(upperDistance, lowerDistance)

    if (upperDistance > 0) {
      maxUpperDistance.current = Math.max(
        maxUpperDistance.current,
        upperDistance,
      )
      lastBounceDirection.current = 'upper'
    } else if (lowerDistance > 0) {
      maxLowerDistance.current = Math.max(
        maxLowerDistance.current,
        lowerDistance,
      )
      lastBounceDirection.current = 'lower'
    }
  }

  function nativeBounceScrollEnd(event: ScrollEvent) {
    'main thread'
    const offset = isVertical
      ? event.detail.scrollTop
      : event.detail.scrollLeft
    const scrollSize = isVertical
      ? event.detail.scrollHeight
      : event.detail.scrollWidth
    const viewportSize = isVertical ? height.current : width.current
    const { upperDistance, lowerDistance } = getNativeBounceMetricsMT(
      offset,
      scrollSize,
      viewportSize,
      enableUpper,
      enableLower,
    )

    setBounceViewOffset(upperDistance, lowerDistance)

    const direction = lastBounceDirection.current
    const triggerDistance = direction === 'upper'
      ? (options.bounceableOptions.startBounceTriggerDistance ?? 0)
      : (options.bounceableOptions.endBounceTriggerDistance ?? 0)
    const maxDistance = direction === 'upper'
      ? maxUpperDistance.current
      : maxLowerDistance.current

    mtsLog(
      debugLogEnabled,
      `[lynx-ui-scroll-view][useNativeBounce] scroll end, offset: ${offset}, upperDistance: ${upperDistance}, lowerDistance: ${lowerDistance}, direction: ${
        String(direction)
      }, maxUpperDistance: ${maxUpperDistance.current}, maxLowerDistance: ${maxLowerDistance.current}, triggerDistance: ${triggerDistance}`,
    )

    if (
      direction !== null
      && maxDistance > triggerDistance
    ) {
      runOnBackground(onScrollToBouncesJS)({ direction })
    }

    maxUpperDistance.current = 0
    maxLowerDistance.current = 0
    lastBounceDirection.current = null
  }

  return {
    'main-thread:bindlayoutchange': nativeBounceLayoutChange,
    'main-thread:bindscroll': nativeBounceScroll,
    'main-thread:bindscrollend': nativeBounceScrollEnd,
  }
}
