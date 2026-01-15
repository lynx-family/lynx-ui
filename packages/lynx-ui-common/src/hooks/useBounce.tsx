// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnBackground, useMainThreadRef } from '@lynx-js/react'

import type { CommonEvent, MainThread, ScrollEvent } from '@lynx-js/types'

import type { BounceableBasicProps, scrollToBouncesInfo } from '../types'
import { selectorMT } from '../utils/selector'

export interface useBounceOptions {
  bounceableOptions: BounceableBasicProps
  /**
   * idSelector of scroll container
   */
  id?: string
  /**
   * scroll direction
   */
  scrollOrientation: 'vertical' | 'horizontal'
}

export interface bounceHandlers {
  'main-thread:bindtouchstart': (event: MainThread.TouchEvent) => void
  'main-thread:bindtouchend': () => void
  'main-thread:bindtouchmove': (event: MainThread.TouchEvent) => void
  'main-thread:bindlayoutchange': (event: CommonEvent) => void
  'main-thread:bindscroll': (event: ScrollEvent) => void
  onUpperExposure: (_event: CommonEvent) => void
  onUpperDisexposure: (_event: CommonEvent) => void
  onLowerExposure: (_event: CommonEvent) => void
  onLowerDisexposure: (_event: CommonEvent) => void
}

export function useBounce(options: useBounceOptions): bounceHandlers {
  // Control the damping coefficient during rubber effect. The smaller it is, the harder the spring effect.
  const rubberC = useMainThreadRef(0.55)
  // Control the fling deceleration coefficient during dropdown. The smaller it is, the faster it stops.
  const flingDeceleratingRate = useMainThreadRef(0.99)
  // The rebound coefficient during bounce back, the larger it is, the faster the rebound speed.
  const beta = useMainThreadRef(15)

  const debugLog = useMainThreadRef(
    options.bounceableOptions.debugLog ?? false,
  )

  const singleSidedBounce = useMainThreadRef(
    options.bounceableOptions.singleSidedBounce ?? 'both',
  )

  // The starting point of current touch procedure
  const startTouch = useMainThreadRef({})
  // Record the previous touch and clear it on touchEnd. If current is not empty, then it means that the scrollable object is being dragged.
  const prevTouch = useMainThreadRef({})

  // Current scroll velocity.
  const scrollVelocity = useMainThreadRef(0)
  // Current bouncing position.
  const bouncingPositionInfo = useMainThreadRef({})

  // If reaches edge and bouncing starts during dragging, save the touch point and calculate later touch delta for rubberEffect.
  const startBouncingTouch = useMainThreadRef({})
  // If reaches edge and bouncing starts during dragging, save current bouncingPosition and continues rubberEffect's calculation from this point.
  const startTouchBouncingDelta = useMainThreadRef({})
  // when touch starts during bouncing, save current bouncingPosition and continues rubberEffect's calculation from this point.
  const bouncingTouchStartPosition = useMainThreadRef({})

  // Used to record the previous scroll position and calculate current scroll velocity.
  const prevScroll = useMainThreadRef({})

  // scroll container's basic info.
  const height = useMainThreadRef(
    options.bounceableOptions.estimatedHeight
      ?? SystemInfo.pixelHeight / SystemInfo.pixelRatio,
  )
  const width = useMainThreadRef(
    options.bounceableOptions.estimatedWidth
      ?? SystemInfo.pixelWidth / SystemInfo.pixelRatio,
  )
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

  // Read from props
  const containerID = options.id ?? 'bounceableContainer'
  const { enableBounces, onScrollToBounces } = options.bounceableOptions
  const alwaysBouncing = options.bounceableOptions.alwaysBouncing ?? false
  const scrollOrientation = options.scrollOrientation ?? 'vertical'
  const enableBounceEventInFling =
    options.bounceableOptions.enableBounceEventInFling ?? true
  const startBounceTriggerDistance =
    options.bounceableOptions.startBounceTriggerDistance ?? 0
  const endBounceTriggerDistance =
    options.bounceableOptions.endBounceTriggerDistance ?? 0
  // Temporary workaround as requestAnimationFrame will crash below Lynx 2.15.2.
  const temporaryValidVersionCheckForRAF = useMainThreadRef(
    options.bounceableOptions.validAnimationVersion ?? false,
  )

  const bouncingStatus = {
    inScrollingRange: 0,
    upperBouncing: 1,
    lowerBouncing: 2,
    noBouncing: 3,
    alwaysBouncing: 4,
  }

  function isVertical() {
    'main thread'
    return scrollOrientation === 'vertical'
  }

  function threshold() {
    'main thread'
    return 1.0 / Number(SystemInfo.pixelRatio)
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
    if (isAndroid()) {
      selectorMT(containerID)?.setAttribute('enable-scroll', enable)
    }
  }

  // Clear all temps when a touch procedure ends.
  function clearTouchInfo() {
    'main thread'
    if (debugLog.current) {
      console.info('clearTouchInfo')
    }
    startTouch.current = {}
    bouncingTouchStartPosition.current = 0
    prevTouch.current = {}
    startBouncingTouch.current = {}
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

  // Calculate current touch delta based on 'startPoint'. The startPoint here should be startBouncingTouch which means this bouncing effect happens during a touch procedure.
  function getCurrentDelta(event: MainThread.TouchEvent) {
    'main thread'
    if (!isEmpty(startTouch.current)) {
      if (isEmpty(startBouncingTouch.current)) {
        return scrollOrientation === 'vertical'
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          ? event.touches[0].pageY - startTouch.current[0].pageY
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          : event.touches[0].pageX - startTouch.current[0].pageX
      } else {
        return scrollOrientation === 'vertical'
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          ? event.touches[0].pageY - startBouncingTouch.current[0].pageY
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          : event.touches[0].pageX - startBouncingTouch.current[0].pageX
      }
    }
    return 0
  }

  // Key bouncing status judgement.
  function getBouncingStatus() {
    'main thread'
    // @ts-expect-error Expected
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const currentPosition = bouncingPositionInfo.current?.bouncingOffset ?? 0
    if (Boolean(toUpper.current) && Boolean(toLower.current)) {
      return alwaysBouncing
        ? bouncingStatus.alwaysBouncing
        : bouncingStatus.noBouncing
    }

    // upper bouncing
    const initialLayoutPosition = 0
    if (debugLog.current) {
      console.info(
        'getBouncingStatus',
        initialLayoutPosition,
        'currentPosition',
        currentPosition,
      )
    }

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

  // Use translate to implement real bouncing effect
  function bouncingSetStyle(offset: number) {
    'main thread'
    if (isNaN(Number(offset))) {
      console.error('ERROR! bouncingOffset is NaN')
      return
    }
    // update bouncingPositionInfo first
    if (isEmpty(bouncingPositionInfo.current)) {
      // @ts-expect-error expected
      bouncingPositionInfo.current.velocity = 0
    } else {
      // @ts-expect-error expected
      bouncingPositionInfo.current.velocity =
        // @ts-expect-error expected
        (offset - bouncingPositionInfo.current.bouncingOffset || 0)
        // @ts-expect-error expected
        / (Date.now() - bouncingPositionInfo.current.timeStamp)
    }
    // @ts-expect-error expected
    bouncingPositionInfo.current.bouncingOffset = offset
    // @ts-expect-error expected
    bouncingPositionInfo.current.timeStamp = Date.now()
    // When bouncing effect ends, clear startTouch and bouncingTouchStartPosition
    if (offset === 0 && !isEmpty(prevTouch.current)) {
      startTouch.current = prevTouch.current
      bouncingTouchStartPosition.current = {}
    }
    // trigger translate
    if (isVertical()) {
      selectorMT(containerID)?.setStyleProperty(
        'transform',
        `translateY(${offset}px)`,
      )
      selectorMT(`${containerID}-upperBounceWrapper`)?.setStyleProperty(
        'transform',
        `translateY(${offset}px)`,
      )
      selectorMT(`${containerID}-lowerBounceWrapper`)?.setStyleProperty(
        'transform',
        `translateY(${offset}px)`,
      )
    } else {
      selectorMT(containerID)?.setStyleProperty(
        'transform',
        `translateX(${offset}px)`,
      )
      selectorMT(`${containerID}-upperBounceWrapper`)?.setStyleProperty(
        'transform',
        `translateX(${offset}px)`,
      )
      selectorMT(`${containerID}-lowerBounceWrapper`)?.setStyleProperty(
        'transform',
        `translateX(${offset}px)`,
      )
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
    if (debugLog.current) {
      console.info('triggerScrollToBouncesEvent', isUpper ? 'upper' : 'lower')
    }

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
    if (debugLog.current) {
      console.info(
        'rubberEffect',
        'scrollViewFrameSize',
        scrollViewFrameSize,
        'touchStartPosition',
        touchStartPosition,
        'deltaYForTouchStartPosition',
        deltaYForTouchStartPosition,
        'deltaYForNextPosition',
        deltaYForNextPosition,
        'rubberBandingDistance',
        rubberBandingDistance,
      )
    }

    bouncingSetStyle(isNegative * rubberBandingDistance)
  }

  function triggerRubberEffectIfCrossingEdge(event: MainThread.TouchEvent) {
    'main thread'
    const delta = getCurrentDelta(event)
    if (debugLog.current) {
      console.info(
        'isCrossingEdge',
        'delta',
        delta,
        'toUpper',
        toUpper.current,
        'toLower',
        toLower.current,
      )
    }

    // Crossing top range
    if (
      toUpper.current === true && delta > 0
      && (singleSidedBounce.current === 'both'
        || singleSidedBounce.current === 'upper')
    ) {
      enableScroll(false)
      rubberEffect(delta > 0 ? 1 : -1, delta)
    }

    // Crossing bottom range
    if (
      toLower.current === true && delta < 0
      && (singleSidedBounce.current === 'both'
        || singleSidedBounce.current === 'lower')
    ) {
      enableScroll(false)
      rubberEffect(delta > 0 ? 1 : -1, delta)
    }
    enableScroll(true)
  }

  // return true if scrollToBounces should be sent
  function isOverTriggerDistance() {
    'main thread'
    // @ts-expect-error expected
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const bouncingTop: number = bouncingPositionInfo.current.bouncingOffset ?? 0
    const triggerDistance =
      // @ts-expect-error expected
      bouncingPositionInfo.current?.bouncingOffset > 0
        ? startBounceTriggerDistance
        : endBounceTriggerDistance
    const delta = Math.abs(bouncingTop) - Math.abs(triggerDistance)
    return delta > threshold()
  }

  function bouncingBack() {
    'main thread'
    if (debugLog.current) {
      console.info('fling forward end')

      console.info('bounce back starts')
    }

    // step3: bounce back
    // @ts-expect-error expected
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const C1 = bouncingPositionInfo.current.bouncingOffset ?? 0
    const startTime = Date.now()
    const touchingEndBouncingBackFrame = () => {
      if (Boolean(touchingEndBouncingBackEnableFlag.current) === false) {
        return
      }
      const currentTime = Date.now() - startTime
      if (debugLog.current) {
        console.info('touchingEndBouncingBackFrame')
      }

      // critical damping
      const C2 = beta.current * C1
      const easedDistance = (C1 + C2 * (currentTime / 1000))
        * Math.pow(Math.E, -beta.current * (currentTime / 1000))
      bouncingSetStyle(easedDistance)
      if (Math.abs(easedDistance) < threshold()) {
        // Make sure it backs to 0
        bouncingSetStyle(0)
        if (debugLog.current) {
          console.info('bounce back ends')
        }
      } else {
        customRequestAnimationFrame(touchingEndBouncingBackFrame)
      }
    }

    customRequestAnimationFrame(touchingEndBouncingBackFrame)
    touchingEndBouncingBackEnableFlag.current = true
  }

  // bindtouchstart. Save startTouch and bouncingPosition if a bouncing effect is happening.
  function bounceableTouchStart(event: MainThread.TouchEvent) {
    'main thread'
    startTouch.current = event.touches
    if (debugLog.current) {
      console.info('bounceableTouchStart')
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    bouncingTouchStartPosition.current =
      // @ts-expect-error expected
      bouncingPositionInfo.current?.bouncingOffset ?? 0
    // reset all animation flags. No animation should play during a touch.
    touchEndFrameEnableFlag.current = false
    touchingEndBouncingBackEnableFlag.current = false
    flingEndWithBouncingEnableFlag.current = false
  }

  function bounceableTouchMove(event: MainThread.TouchEvent) {
    'main thread'
    prevTouch.current = event.touches
    if (isEmpty(startTouch.current)) {
      // It means current situation is illegal. A touchMove event happens without a touchStart event beforehand. Or a touchMove event happens after a touchEnd event.

      console.info('ERROR! touch not started')
    } else {
      const delta = getCurrentDelta(event)
      const currentBouncingStatus = getBouncingStatus()
      // Judge the status and trigger rubberEffect. The TouchMove should only consider rubberEffect and nothing else.
      switch (currentBouncingStatus) {
        case bouncingStatus.upperBouncing: {
          enableScroll(false)
          rubberEffect(1, delta)
          if (debugLog.current) {
            console.info('bounceableTouchMove upperBouncing')
          }
          break
        }
        case bouncingStatus.lowerBouncing: {
          enableScroll(false)
          rubberEffect(-1, delta)
          if (debugLog.current) {
            console.info('bounceableTouchMove lowerBouncing')
          }
          break
        }
        case bouncingStatus.alwaysBouncing: {
          if (debugLog.current) {
            console.info('bounceableTouchMove alwaysBouncing')
          }
          if (alwaysBouncing) {
            triggerRubberEffectIfCrossingEdge(event)
          }
          break
        }
        case bouncingStatus.inScrollingRange: {
          if (debugLog.current) {
            console.info('bounceableTouchMove inScrollingRange')
          }
          triggerRubberEffectIfCrossingEdge(event)
          break
        }
        default:
          break
      }
    }
  }

  // bindtouchend. In touchEnd event the fling forward animation and bouncingBack animation should be triggered if necessary.
  function bounceableTouchEnd() {
    'main thread'
    // Reset the state. The touch information should be reset, and we should no longer ban the enable-scroll.
    clearTouchInfo()
    enableScroll(true)
    if (debugLog.current) {
      console.info('bounceableTouchEnd')
    }
    if (shouldBounceWhenTouchEnd(getBouncingStatus())) {
      const startTime = Date.now()
      // @ts-expect-error expected
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const dragEndVelocity = bouncingPositionInfo.current?.velocity
      // @ts-expect-error expected
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const dragEndPosition = bouncingPositionInfo.current?.bouncingOffset ?? 0
      // Send scrolltobounces event.
      if (isOverTriggerDistance()) {
        triggerScrollToBouncesEvent(
          // @ts-expect-error expected
          bouncingPositionInfo.current?.bouncingOffset > 0,
        )
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      let currentVelocity: number = dragEndVelocity
      const touchEndProcessFrame = () => {
        if (Boolean(touchEndFrameEnableFlag.current) === false) {
          return
        }
        if (debugLog.current) {
          console.info('touchEndProcessFrame')
        }
        if (Math.abs(currentVelocity) <= threshold()) {
          // If the velocity is already under threshold, skip fling and start step3: bounce back.
          bouncingBack()
        } else {
          // If the drag end with a velocity, start fling to consume it.
          // step 2: fling down
          if (debugLog.current) {
            console.info('fling down start')
          }
          // This function is obtained by integrating the velocity function with a deceleration rate of flingDeceleratingRate.
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const distance: number = dragEndPosition
            + (dragEndVelocity
                * (Math.pow(
                  flingDeceleratingRate.current,
                  Date.now() - startTime,
                )
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
  }

  // Save the bindscroll info and calculate velocity.
  function bounceableHandleScroll(event: ScrollEvent) {
    'main thread'
    scrollX.current = event.detail.scrollLeft
    scrollY.current = event.detail.scrollTop
    if (!isEmpty(prevScroll.current)) {
      // @ts-expect-error expected
      const timeDuration = Date.now() - prevScroll.current.timestamp
      const deltaY = isVertical() // @ts-expect-error expected
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ? event.detail.scrollTop - prevScroll.current.detail.scrollTop // @ts-expect-error expected
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        : event.detail.scrollLeft - prevScroll.current.detail.scrollLeft
      const velocity = deltaY / timeDuration
      scrollVelocity.current = velocity
    }
    prevScroll.current = event
  }

  function onUpperDisexposure(_event: CommonEvent) {
    'main thread'
    if (debugLog.current) {
      console.info('upper disexposure')
    }
    toUpper.current = false
  }

  // Handle scrolltoupper event.
  function onUpperExposure(_event: CommonEvent) {
    'main thread'
    if (debugLog.current) {
      console.info('upper exposure')
    }
    toUpper.current = true
    if (
      singleSidedBounce.current !== 'upper'
      && singleSidedBounce.current !== 'both'
    ) {
      return
    }
    if (prevScroll.current) {
      // reaches edge during touch
      startBouncingTouch.current = prevTouch.current
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      startTouchBouncingDelta.current =
        // @ts-expect-error expected
        bouncingPositionInfo.current?.bouncingOffset ?? 0
    } else if (Math.abs(scrollVelocity.current) > threshold()) {
      // reaches edge during fling
      const velocity = scrollVelocity.current
      let currentVelocity = velocity
      const startTime = Date.now()
      if (debugLog.current) {
        console.info('fling to upper event start with velocity', velocity)
      }
      let sentScrollToBouncesEvent = false // only sent scrollToBounces once
      const flingEndWithBouncingFrame = () => {
        if (Boolean(flingEndWithBouncingEnableFlag.current) === false) {
          if (debugLog.current) {
            console.info('flingEndWithBouncingEnableFlag early return')
          }
          return
        }
        if (Math.abs(currentVelocity) <= threshold()) {
          flingEndWithBouncingEnableFlag.current = false
          if (debugLog.current) {
            console.info('fling to upper event end')

            console.info('bouncing to upper event start')
          }
          bouncingBack()
        } else {
          // step 1: fling
          const distance = (currentVelocity
            * (Math.pow(flingDeceleratingRate.current, Date.now() - startTime)
              - 1))
            / Math.log(flingDeceleratingRate.current)
          bouncingSetStyle(-distance)
          if (!sentScrollToBouncesEvent && isOverTriggerDistance()) {
            triggerScrollToBouncesEvent(
              // @ts-expect-error expected
              bouncingPositionInfo.current?.bouncingOffset > 0,
            )
            sentScrollToBouncesEvent = true
          }
          currentVelocity = velocity
            * Math.pow(flingDeceleratingRate.current, Date.now() - startTime)
          if (flingEndWithBouncingEnableFlag.current) {
            customRequestAnimationFrame(flingEndWithBouncingFrame)
          }
        }
      }
      customRequestAnimationFrame(flingEndWithBouncingFrame)
      flingEndWithBouncingEnableFlag.current = true
    }
  }

  function onLowerDisexposure(_event: CommonEvent) {
    'main thread'
    if (debugLog.current) {
      console.info('lower disexposure')
    }
    toLower.current = false
  }

  function onLowerExposure(_event: CommonEvent) {
    'main thread'
    if (debugLog.current) {
      console.info('lower exposure')
    }
    toLower.current = true
    if (
      singleSidedBounce.current !== 'lower'
      && singleSidedBounce.current !== 'both'
    ) {
      return
    }
    // reaches lower during dragging
    if (!isEmpty(prevTouch.current)) {
      startBouncingTouch.current = prevTouch.current
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      startTouchBouncingDelta.current =
        // @ts-expect-error expected
        bouncingPositionInfo.current?.bouncingOffset ?? 0
    } else if (enableBounceEventInFling && scrollVelocity.current > 0) {
      const velocity = scrollVelocity.current
      if (debugLog.current) {
        console.info('lower velocity', velocity)
      }

      // scroll to end with velocity, start bouncing effect
      if (Math.abs(velocity) > threshold()) {
        let currentVelocity = velocity
        const startTime = Date.now()
        if (debugLog.current) {
          console.info('fling to lower event start with velocity', velocity)
        }
        let sentScrollToBouncesEvent = false // only sent scrollToBounces once
        const flingEndWithBouncingFrame = () => {
          if (Boolean(flingEndWithBouncingEnableFlag.current) === false) {
            if (debugLog.current) {
              console.info('flingEndWithBouncingEnableFlag early return')
            }
            return
          }
          if (Math.abs(currentVelocity) <= threshold()) {
            flingEndWithBouncingEnableFlag.current = false
            if (debugLog.current) {
              console.info('fling to lower event end')

              console.info('bouncing to lower event start')
            }
            bouncingBack()
          } else {
            // step 1: fling
            const distance = (currentVelocity
              * (Math.pow(
                flingDeceleratingRate.current,
                Date.now() - startTime,
              )
                - 1))
              / Math.log(flingDeceleratingRate.current)
            bouncingSetStyle(-distance)
            if (!sentScrollToBouncesEvent && isOverTriggerDistance()) {
              triggerScrollToBouncesEvent(
                // @ts-expect-error expected
                bouncingPositionInfo.current?.bouncingOffset > 0,
              )
              sentScrollToBouncesEvent = true
            }
            currentVelocity = velocity
              * Math.pow(flingDeceleratingRate.current, Date.now() - startTime)
            if (flingEndWithBouncingEnableFlag) {
              customRequestAnimationFrame(flingEndWithBouncingFrame)
            }
          }
        }
        customRequestAnimationFrame(flingEndWithBouncingFrame)
        flingEndWithBouncingEnableFlag.current = true
      }
    }
  }

  // Used to get the size of scroll container.
  function bounceableLayoutChange(event: CommonEvent) {
    'main thread'
    // @ts-expect-error expected
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    height.current = isAndroid() ? event.params?.height : event.detail?.height
    // @ts-expect-error expected
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    width.current = isAndroid() ? event.params?.width : event.detail?.width
  }

  return {
    'main-thread:bindtouchstart': bounceableTouchStart,
    'main-thread:bindtouchend': bounceableTouchEnd,
    'main-thread:bindtouchmove': bounceableTouchMove,
    'main-thread:bindlayoutchange': bounceableLayoutChange,
    'main-thread:bindscroll': bounceableHandleScroll,
    onUpperExposure,
    onUpperDisexposure,
    onLowerExposure,
    onLowerDisexposure,
  }
}
