// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnBackground,
  runOnMainThread,
  useMainThreadRef,
} from '@lynx-js/react'

import { useTapLock } from '@lynx-js/react-use'
import type { MainThread } from '@lynx-js/types'

import { limiter } from '../utils'
import { useAnimate } from './useAnimate'
import { useAutoplay } from './useAutoPlay'
import { useAxisLock } from './useAxisLock'
import { useSwipeCallback } from './useSwipeCallback'
import { useVelocity } from './useVelocity'
import { SwipeDirection } from '../types'
import type {
  BounceConfig,
  CompoundModeConfig,
  OffsetLimitResult,
  ResetOptions,
  SwipeToOptions,
  SwiperProps,
  onBounceParams,
} from '../types'
import { useDirection } from './useDirection'

interface UseOffsetOpts extends
  Required<
    Pick<
      SwiperProps<unknown>,
      | 'loop'
      | 'duration'
      | 'initialIndex'
      | 'containerWidth'
      | 'autoPlay'
      | 'autoPlayInterval'
      | 'consumeSlideEvent'
      | 'RTL'
    >
  >
{
  dataCount: number
  size: number
  spaceBetween: number
  easing: NonNullable<SwiperProps<unknown>['main-thread:easing']>
  modeConfig: CompoundModeConfig
  enableBounce: boolean
  startBounceItemWidth: NonNullable<BounceConfig['startBounceItemWidth']>
  endBounceItemWidth: NonNullable<BounceConfig['endBounceItemWidth']>
  onStartBounceItemBounce: BounceConfig['onStartBounceItemBounce']
  onEndBounceItemBounce: BounceConfig['onStartBounceItemBounce']
  experimentalHorizontalSwipeOnly: boolean
  onSwipeStopMT: () => void
  onSwipeStartMT: () => void
  offsetLimit: OffsetLimitResult
}

// TODO(@wangyang.ryan) Use Function from utils.
// MTS imported from other files has bug now.
function customRound(num: number, threshold = 0.5) {
  'main thread'
  const decimal = num - Math.floor(num)

  // Check if the decimal part is greater than or equal to 0.9
  if (decimal >= threshold) {
    return Math.ceil(num)
  } else {
    return Math.floor(num)
  }
}

function rubberEffect(rubberDelta: number, bounceWidth: number): number {
  'main thread'

  if (rubberDelta === 0 || bounceWidth === 0) {
    return 0
  }

  // Assumes the bounce should max out when the user swipes 2x the bounceWidth.
  const swipeLimit = bounceWidth * 2.0
  const scaleFactor = 1.5 // (2.0 + 1.0) / 2.0

  const absDelta = Math.abs(rubberDelta)
  const effectiveDelta = Math.min(absDelta, swipeLimit)

  const bounce = effectiveDelta / (effectiveDelta / bounceWidth + 1.0)

  return Math.sign(rubberDelta) * bounce * scaleFactor
}

/**
 * This hook are used to maintain a virtual offset, which does not necessarily reflect the actual
 * location of the swiper
 */
function useOffset(
  {
    loop,
    duration,
    size,
    spaceBetween,
    easing,
    dataCount,
    initialIndex,
    autoPlay,
    autoPlayInterval,
    offsetLimit,
    enableBounce,
    startBounceItemWidth,
    endBounceItemWidth,
    onStartBounceItemBounce,
    onEndBounceItemBounce,
    experimentalHorizontalSwipeOnly,
    onSwipeStartMT,
    onSwipeStopMT,
    consumeSlideEvent,
    RTL,
  }: UseOffsetOpts,
  onOffsetUpdate: (offset: number, direction: SwipeDirection) => void,
) {
  // fullSize contains size and spaceBetween
  const fullSize = size + spaceBetween
  function getInitialOffset() {
    return limiter(
      -fullSize * initialIndex,
      dataCount,
      size,
      spaceBetween,
      loop,
      offsetLimit,
    )
  }

  const touchStartRef = useMainThreadRef<number>(0)
  const touchStartCrossAxisRef = useMainThreadRef<number>(0)
  const lastScrollOffsetRef = useMainThreadRef<number>(getInitialOffset())
  const offsetRef = useMainThreadRef<number>(getInitialOffset())
  // To record the previous index before offset change
  const prevIndexRef = useMainThreadRef<number>(initialIndex)
  const { velocityTouchMove, velocityTouchStart, getVelocity } = useVelocity({
    RTL,
  })
  const { cancel: cancelAnimation, animate } = useAnimate()

  const reachedBounceRef = useMainThreadRef(false)
  const bounceDeltaRef = useMainThreadRef(0)

  const {
    directionRef,
    handleTouchStart: directionTouchStart,
    handleTouchMove: directionTouchMove,
    handleTouchEnd: directionTouchEnd,
    overrideDirection,
  } = useDirection({
    RTL,
  })

  function getCurrentIndex() {
    'main thread'
    const totalWidth = fullSize * dataCount
    const currentIndex = ((-offsetRef.current + totalWidth) % totalWidth)
      / fullSize
    return currentIndex
  }

  // Offset should only be updated by this function.
  function setOffset(offset: number) {
    'main thread'
    if (isNaN(offset)) {
      throw new Error('calcBounceOffset: invalid offset')
    }
    offsetRef.current = offset
    prevIndexRef.current = getCurrentIndex()
    onOffsetUpdate(offset, directionRef.current)
  }

  function calcLimitCompact(offset: number, options?: {
    type: 'prev' | 'next'
  }): {
    offset: number
    reachingLimit: -1 | 0 | 1
  } {
    'main thread'
    let reachingLimit: -1 | 0 | 1 = 0
    let finalOffset = offset
    if (dataCount === 0) {
      if (options?.type === 'prev') {
        return { offset: 0, reachingLimit: -1 }
      }
      return { offset: 0, reachingLimit: 1 }
    }
    if (!loop) {
      if (offset >= -offsetLimit.startLimit) {
        reachingLimit = -1
        finalOffset = -offsetLimit.startLimit
      } else if (offset <= -fullSize * (dataCount - 1) + offsetLimit.endLimit) {
        reachingLimit = 1
        finalOffset = -fullSize * (dataCount - 1) + offsetLimit.endLimit
      }
    }
    return { offset: finalOffset, reachingLimit }
  }

  function calcBounceOffsetAndLimit(offset: number) {
    'main thread'
    const { offset: limitOffset, reachingLimit } = calcLimitCompact(offset)

    if (enableBounce && reachingLimit) {
      const bounceDelta = offset - limitOffset
      const bounceItemWidth = reachingLimit === -1
        ? startBounceItemWidth
        : (offsetLimit.isNotEnoughForScreen ? 0 : endBounceItemWidth)
      reachedBounceRef.current = true
      bounceDeltaRef.current = rubberEffect(bounceDelta, bounceItemWidth)
      return limitOffset + bounceDeltaRef.current
    }
    return limitOffset
  }

  // We use rounding as threshold of when will the swiper to apply paging.
  // When rounding is 0.7, then index 1.6 will be paged to 1, and 1.8 will be paged to 2
  function calcPaging(offset: number, rounding = 0.5) {
    'main thread'
    const { offset: limitOffset, reachingLimit } = calcLimitCompact(offset)
    if (reachingLimit) {
      return limitOffset
    }

    return customRound(-offset / fullSize, rounding) * -fullSize
  }

  function calcLoop(start: number, end: number) {
    'main thread'
    let startOffset = start
    let finalOffset = end
    if (dataCount === 0) {
      return { offset: 0, finalOffset: 0 }
    }
    const totalWidth = fullSize * dataCount
    if (loop) {
      if (finalOffset < -totalWidth + fullSize) {
        // If go beyond last item, like n + 1 item, let the destination be 1
        finalOffset = finalOffset + totalWidth
        startOffset = startOffset + totalWidth
      } else if (finalOffset > 0) {
        // If go before first item, like -1 item, let the destination be n - 1
        finalOffset = finalOffset - totalWidth
        startOffset = startOffset - totalWidth
      }
    }
    return {
      offset: startOffset,
      finalOffset,
    }
  }

  const {
    handleTouchMove: swipeCallbackTouchMove,
    handleTouchStart: swipeCallbackTouchStart,
    setSwipeEndMT,
    setSwipeStartMT,
  } = useSwipeCallback({
    onSwipeStartMT,
    onSwipeStopMT,
  })

  const {
    handleTouchStart: axisLockTouchStart,
    handleTouchMove: axisLockTouchMove,
    handleTouchEnd: axisLockTouchEnd,
    handleVelocity: axisLockVelocity,
  } = useAxisLock({
    consumeSlideEvent,
    experimentalHorizontalSwipeOnly,
  })

  const {
    handleTouchStart: tapLockTouchStart,
    handleTouchMove: tapLockTouchMove,
    handleTouchEnd: tapLockTouchEnd,
  } = useTapLock()

  function easingTo(start: number, end: number, onFinished?: () => void) {
    'main thread'
    function onProgress(progress: number) {
      const interpolatedProgress = easing(progress / 100)
      const animeOffset = (end - start) * interpolatedProgress + start

      setOffset(animeOffset)
    }

    animate(duration, onProgress, onFinished)
  }

  function hasNextMTS() {
    'main thread'
    const offset = offsetRef.current
    const { reachingLimit } = calcLimitCompact(offset)

    return reachingLimit !== 1
  }

  function hasPrevMTS() {
    'main thread'
    const offset = offsetRef.current
    const { reachingLimit } = calcLimitCompact(offset)

    return reachingLimit !== -1
  }

  function swipeToMTS(index: number, options?: SwipeToOptions) {
    'main thread'
    if (dataCount === 0) {
      setSwipeEndMT()
      return
    }

    const finalIndex = Math.max(Math.min(index, dataCount - 1), 0)
    const currentIndex = getCurrentIndex()
    const { offset: finalOffset } = calcLimitCompact(-finalIndex * fullSize)
    setSwipeStartMT()

    if (finalIndex > currentIndex) {
      overrideDirection(SwipeDirection.NORMAL)
    } else if (finalIndex < currentIndex) {
      overrideDirection(SwipeDirection.REVERT)
    } else {
      overrideDirection(SwipeDirection.NONE)
    }

    if (options?.animate) {
      easingTo(offsetRef.current, finalOffset, () => {
        if (options?.onFinished) {
          options.onFinished()
        }
        setSwipeEndMT()
      })
    } else {
      setOffset(finalOffset)
      setSwipeEndMT()
    }
  }

  function swipeNextMTS(options?: SwipeToOptions) {
    'main thread'

    if (!hasNextMTS()) {
      setSwipeEndMT()
      return
    }

    setSwipeStartMT()
    let offset = offsetRef.current
    let finalOffset = calcPaging(offset - fullSize, 0.95)

    if (loop) {
      const result = calcLoop(offset, finalOffset)
      offset = result.offset
      finalOffset = result.finalOffset
    } else {
      const result = calcLimitCompact(finalOffset)
      finalOffset = result.offset
    }

    overrideDirection(SwipeDirection.NORMAL)

    if (options?.animate === false) {
      setOffset(finalOffset)
      setSwipeEndMT()
    } else {
      easingTo(offset, finalOffset, () => {
        if (options?.onFinished) {
          options.onFinished()
        }
        setSwipeEndMT()
      })
    }
  }

  function swipePrevMTS(options?: SwipeToOptions) {
    'main thread'

    if (!hasPrevMTS()) {
      setSwipeEndMT()
      return
    }

    setSwipeStartMT()
    let offset = offsetRef.current
    let finalOffset = calcPaging(offset + fullSize, 0.05)
    if (loop) {
      const result = calcLoop(offset, finalOffset)
      offset = result.offset
      finalOffset = result.finalOffset
    } else {
      const result = calcLimitCompact(finalOffset)
      finalOffset = result.offset
    }

    overrideDirection(SwipeDirection.REVERT)

    if (options?.animate === false) {
      setOffset(finalOffset)
      setSwipeEndMT()
    } else {
      easingTo(offset, finalOffset, () => {
        if (options?.onFinished) {
          options.onFinished()
        }
        setSwipeEndMT()
      })
    }
  }

  function swipePrev(options?: SwipeToOptions) {
    runOnMainThread(swipePrevMTS)(options)
  }

  function swipeNext(options?: SwipeToOptions) {
    runOnMainThread(swipeNextMTS)(options)
  }

  function swipeTo(index: number, options?: SwipeToOptions) {
    runOnMainThread(swipeToMTS)(index, options)
  }

  function handleOnBounce(params: onBounceParams) {
    if (params.type === 'start' && onStartBounceItemBounce) {
      onStartBounceItemBounce(params)
    } else if (params.type === 'end' && onEndBounceItemBounce) {
      onEndBounceItemBounce(params)
    }
  }

  function handleBounceCallback(offset: number) {
    'main thread'
    if (reachedBounceRef.current) {
      runOnBackground(handleOnBounce)({
        type: offset > 0 ? 'start' : 'end',
        offset: Math.abs(bounceDeltaRef.current),
      })
      reachedBounceRef.current = false
      bounceDeltaRef.current = 0
    }
  }

  const {
    pauseMT: pauseAutoPlayMT,
    startMT: startAutoPlayMT,
  } = useAutoplay({
    autoPlay,
    autoPlayInterval,
    prevMT: swipePrevMTS,
    nextMT: swipeNextMTS,
    duration,
    dataCount,
  })

  function handleVelocity() {
    'main thread'
    const VELOCITY_THRESHOLD = 300

    if (axisLockVelocity()) {
      return false
    }

    const { velocity: velocityValue, direction } = getVelocity()
    if (Math.abs(velocityValue) > VELOCITY_THRESHOLD) {
      overrideDirection(direction)
      if (direction === SwipeDirection.NORMAL && hasNextMTS()) {
        swipeNextMTS({
          onFinished: () => {
            startAutoPlayMT()
          },
        })
        return true
      } else if (direction === SwipeDirection.REVERT && hasPrevMTS()) {
        swipePrevMTS({
          onFinished: () => {
            startAutoPlayMT()
          },
        })
        return true
      }
    }
    return false
  }

  function handleTouchStart(event: MainThread.TouchEvent) {
    'main thread'
    lastScrollOffsetRef.current = offsetRef.current

    touchStartRef.current = event.detail.x

    touchStartCrossAxisRef.current = event.detail.y
    axisLockTouchStart(event)
    velocityTouchStart(event)
    tapLockTouchStart(event)
    cancelAnimation()
    swipeCallbackTouchStart(event)
    directionTouchStart(event)
    pauseAutoPlayMT()
  }

  function handleTouchMove(event: MainThread.TouchEvent) {
    'main thread'

    if (axisLockTouchMove(event) || tapLockTouchMove(event)) {
      return
    }

    const sign = RTL ? -1 : 1

    let offsetInner = sign * (event.detail.x - touchStartRef.current)
      + lastScrollOffsetRef.current
    offsetInner = calcBounceOffsetAndLimit(offsetInner)
    setOffset(offsetInner)
    velocityTouchMove(event)
    swipeCallbackTouchMove(event)
    directionTouchMove(event)
  }

  function handleTouchEnd(event: MainThread.TouchEvent) {
    'main thread'
    let offset = offsetRef.current

    handleBounceCallback(offset)

    if (handleVelocity()) {
      return
    }
    axisLockTouchEnd()
    directionTouchEnd(event)

    let finalOffset = calcPaging(offset)
    if (loop) {
      const result = calcLoop(offset, finalOffset)
      offset = result.offset
      finalOffset = result.finalOffset
    } else {
      const result = calcLimitCompact(finalOffset)
      finalOffset = result.offset
    }

    tapLockTouchEnd(event)
    easingTo(offset, finalOffset, () => {
      setSwipeEndMT()
      startAutoPlayMT()
    })
  }

  function resetOffsetMT(resetOptions: ResetOptions) {
    'main thread'
    cancelAnimation()
    if (dataCount === 0) {
      swipeToMTS(0)
      return
    }
    if (resetOptions.fullReset) {
      swipeToMTS(resetOptions.resetIndex!, {
        animate: false,
      })
    } else {
      const currentIndex = prevIndexRef.current

      swipeToMTS(currentIndex, {
        animate: false,
      })
    }
  }

  function cancelAnimationJS() {
    runOnMainThread(cancelAnimation)()
  }

  return {
    startAutoPlayMT,
    offsetRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    swipeTo,
    swipeNext,
    swipePrev,
    resetOffsetMT,
    cancelAnimationJS,
  }
}

export { useOffset }
