// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ForwardedRef } from '@lynx-js/react'
import {
  forwardRef,
  memo,
  runOnBackground,
  runOnMainThread,
  useImperativeHandle,
  useMainThreadRef,
  useState,
} from '@lynx-js/react'

import { NativeGesture, useGesture } from '@lynx-js/gesture-runtime'
import { noop, selectorMT } from '@lynx-js/lynx-ui-common'
import type { MainThread } from '@lynx-js/types'

import type {
  SwipeActionProps,
  SwipeActionRef,
  SwipeAction as swipeActionType,
} from './types/index'

export type { SwipeActionProps, SwipeActionRef }

export const SwipeAction = memo(forwardRef(SwipeActionImpl)) as swipeActionType

function SwipeActionImpl(
  props: SwipeActionProps,
  ref: ForwardedRef<SwipeActionRef>,
) {
  const {
    enableSwipe,
    swipeActionId = 'swipeActionId',
    style,
    className,
    displayArea,
    actionArea,
    estimatedActionAreaSize = 0,
    onAction = noop,
    onSwipeStart = noop,
    onSwipeEnd = noop,
    debugLog = false,
    iosEnableSimultaneousTouch = true,
  } = props
  const sampleCurveX = (tx: number, a: number, b: number, c: number) => {
    'main thread'
    return ((a * tx + b) * tx + c) * tx
  }

  const sampleCurveY = (ty: number, a: number, b: number, c: number) => {
    'main thread'
    return ((a * ty + b) * ty + c) * ty
  }

  const solveCurveX = (
    x: number,
    ax: number,
    bx: number,
    cx: number,
    epsilon = 1e-6,
  ) => {
    'main thread'
    let t2 = x
    let x2: number, d2: number
    // Newton's method for solving the t-value corresponding to the x-coordinate of a curve.
    for (let i = 0; i < 8; i++) {
      x2 = sampleCurveX(t2, ax, bx, cx) - x
      if (Math.abs(x2) < epsilon) {
        return t2
      }
      d2 = (3 * ax * t2 + 2 * bx) * t2 + cx
      if (Math.abs(d2) < 1e-6) {
        break
      }
      t2 = t2 - x2 / d2
    }
    // Bisection method.
    let t0 = 0
    let t1 = 1
    t2 = x
    while (t0 < t1) {
      x2 = sampleCurveX(t2, ax, bx, cx)
      if (Math.abs(x2 - x) < epsilon) {
        return t2
      }
      if (x > x2) {
        t0 = t2
      } else {
        t1 = t2
      }
      t2 = (t1 - t0) * 0.5 + t0
    }
    return t2 // Approximate solution.
  }

  const cubicBezier = (
    t: number,
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
  ) => {
    'main thread'
    // calculate the coefficients of a polynomial
    const cx = 3 * p1x
    const bx = 3 * (p2x - p1x) - cx
    const ax = 1 - cx - bx

    const cy = 3 * p1y
    const by = 3 * (p2y - p1y) - cy
    const ay = 1 - cy - by

    return sampleCurveY(solveCurveX(t, ax, bx, cx), ay, by, cy)
  }
  enum movingDirection {
    left = 0,
    right = 1,
  }
  const animationDuration = 350 // ms
  const transformEllison = 0.03 // px
  const swipeMinimumVelocity = useMainThreadRef<number>(0.1) // px/ms  If velocity is less than this, it will not be considered as a swipe
  const prevTouchPointX = useMainThreadRef<number>(0)
  const prevTouchPointY = useMainThreadRef<number>(0)
  const [displayAreaSize, setDisplayAreaSize] = useState(0)

  const lastMovingDirection = useMainThreadRef<movingDirection>(0)

  const currentTransform = useMainThreadRef<number>(0)
  const lastTouchMoveEvent = useMainThreadRef<MainThread.TouchEvent>()
  const lastTouchMoveGestureEvent = useMainThreadRef(null)
  const transformInTouchStart = useMainThreadRef<number>(0)

  const transformStartPosition = useMainThreadRef<number>(0)
  const currentVelocity = useMainThreadRef<number>(0)
  const isFirstJudge = useMainThreadRef<boolean>(true)
  const isStartWithHorizontal = useMainThreadRef<boolean>(false)
  const currentAnimationFrame = useMainThreadRef<number>(-1)

  const swipeGesture: NativeGesture = useGesture(NativeGesture)

  const calculateVelocityGesture = (event) => {
    'main thread'
    if (event == null || lastTouchMoveGestureEvent.current == null) {
      currentVelocity.current = 0
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const deltaTime = event.params.timestamp
      - (lastTouchMoveEvent.current?.timestamp ?? 0)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const deltaX = event.params.clientX
      // @ts-expect-error error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      - lastTouchMoveGestureEvent.current?.params.clientX
    const velocity = deltaX / deltaTime
    currentVelocity.current = velocity
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    lastTouchMoveGestureEvent.current = event
  }

  const [actionAreaSize, setActionAreaSizeInner] = useState(
    estimatedActionAreaSize,
  )

  const actionAreaSizeMTRef = useMainThreadRef<number>(
    estimatedActionAreaSize,
  )

  const totalAreaSize = displayAreaSize + actionAreaSize

  const clearPreviousSwipeAnimation = () => {
    'main thread'
    if (currentAnimationFrame.current !== -1) {
      cancelAnimationFrame(currentAnimationFrame.current)
      currentAnimationFrame.current = -1
    }
  }

  function setActionAreaSize(value: number) {
    setActionAreaSizeInner(value)
    runOnMainThread((areaSize: number) => {
      'main thread'
      actionAreaSizeMTRef.current = areaSize
    })(value)
  }

  const setTransformProperty = (value: number) => {
    'main thread'
    selectorMT(swipeActionId)?.setStyleProperty(
      'transform',
      `translateX(${value}px)`,
    )
  }

  const setTransform = (value: number) => {
    'main thread'
    if (Math.abs(value) < transformEllison) {
      setTransformProperty(0)
      currentTransform.current = 0
      return
    }
    // Clamp delta to valid range [-actionAreaSize, 0]
    let delta = Math.min(0, value)
    delta = Math.max(delta, -actionAreaSizeMTRef.current)

    setTransformProperty(delta)
    if (debugLog) {
      console.info(
        'setTransform id',
        swipeActionId,
        delta,
        actionAreaSizeMTRef.current,
      )
    }
    currentTransform.current = delta
  }

  const isHorizontalTouchMoveGesture = (event) => {
    'main thread'
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const deltaX = event.params.clientX - prevTouchPointX.current
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const deltaY = event.params.clientY - prevTouchPointY.current
    return Math.abs(deltaX) >= Math.abs(deltaY)
  }

  swipeGesture.onTouchesDown((event, manager) => {
    'main thread'
    if (debugLog) {
      console.info(swipeActionId, 'touch start')
    }
    manager.interceptGesture(true)

    isFirstJudge.current = true
    // initialize touch point for this gesture

    prevTouchPointY.current = event.params.clientY

    prevTouchPointX.current = event.params.clientX
    transformStartPosition.current = currentTransform.current
    transformInTouchStart.current = currentTransform.current
    runOnBackground(onSwipeStart)(swipeActionId)
  })

  swipeGesture.onTouchesMove((event, manager) => {
    'main thread'
    if (!enableSwipe) {
      if (debugLog) {
        console.info(swipeActionId, 'swipe disabled')
      }
      return
    }
    if (!isFirstJudge.current && !isStartWithHorizontal.current) {
      if (debugLog) {
        console.info(swipeActionId, 'swipe block due to vertical gesture')
      }
      return
    }
    clearPreviousSwipeAnimation()

    const currentTouchPointX = event.params.clientX

    const currentTouchPointY = event.params.clientY
    const deltaX = currentTouchPointX - prevTouchPointX.current
    if (isFirstJudge.current) {
      isFirstJudge.current = false
      //  only in the first judgement, we change the status of isStartWithHorizontal
      isStartWithHorizontal.current = isHorizontalTouchMoveGesture(event)
      if (isStartWithHorizontal.current) {
        manager.interceptGesture(true)
      } else {
        manager.interceptGesture(false)
        manager.fail()

        prevTouchPointX.current = currentTouchPointX

        prevTouchPointY.current = currentTouchPointY
        return
      }
    }

    prevTouchPointX.current = currentTouchPointX

    prevTouchPointY.current = currentTouchPointY

    calculateVelocityGesture(event)
    // Record last gesture to determine swipe direction is right to delete or left to undo
    lastMovingDirection.current = deltaX > 0
      ? movingDirection.left
      : movingDirection.right

    transformStartPosition.current = currentTransform.current ?? 0

    if (debugLog) {
      console.info(deltaX, transformStartPosition.current)
    }
    setTransform(deltaX + transformStartPosition.current)
  })

  const easingInOut = (t: number) => {
    'main thread'
    return cubicBezier(t, 0, 0, 0.4, 1)
  }

  const swipeAnimation = (
    startTime: number,
    startSwipePoint: number,
    distanceToSwipe: number,
    consumedSwipedTime: number,
    isSwipeRight: boolean,
  ) => {
    'main thread'
    const swipeAnimationInner = () => {
      const currentTime = Date.now() - startTime + consumedSwipedTime
      const timePercentage = currentTime / animationDuration
      const percentage = easingInOut(timePercentage)
      if (isSwipeRight) {
        setTransform(startSwipePoint + distanceToSwipe * percentage)
      } else {
        setTransform(distanceToSwipe * (1 - percentage))
      }
      if (debugLog) {
        console.info(
          'currentTime',
          currentTime,
          percentage,
          distanceToSwipe,
          distanceToSwipe * (1 - percentage),
        )
      }
      if (timePercentage < 1) {
        currentAnimationFrame.current = requestAnimationFrame(
          swipeAnimationInner,
        )
      } else {
        if (isSwipeRight) {
          setTransform(-actionAreaSizeMTRef.current)
        } else {
          setTransform(0)
        }
        currentAnimationFrame.current = -1
      }
    }
    swipeAnimationInner()
  }

  const swipeLeftToUndo = (isCanceling: boolean) => {
    'main thread'
    // Undo
    // |-------------actionAreaSize---------------|
    // |<<<<<<<<<<<<<<<<<<<<<<<|------------------|
    // |----distanceToSwipe----|--distanceSwiped--|
    if (debugLog) {
      console.info(swipeActionId, 'swipeLeftToUndo, isCanceling', isCanceling)
    }
    const distanceToSwipe = currentTransform.current
    const distanceSwipedPercentage = 1
      - Math.abs(currentTransform.current) / actionAreaSizeMTRef.current
    // Make sure cancel process has the same duration as swipe
    const consumedSwipedTime = isCanceling
      ? 0
      : animationDuration * distanceSwipedPercentage
    const startTime = Date.now()
    clearPreviousSwipeAnimation()
    swipeAnimation(
      startTime,
      currentTransform.current,
      distanceToSwipe,
      consumedSwipedTime,
      false,
    )
  }

  const swipeRightToAction = (isCanceling: boolean) => {
    'main thread'
    // Delete
    // |-------------actionAreaSize---------------|
    // |------------------|>>>>>>>>>>>>>>>>>>>>>>>|
    // |--distanceSwiped--|----distanceToSwipe----|
    if (debugLog) {
      console.info(
        swipeActionId,
        'swipeRightToAction, isCanceling',
        isCanceling,
      )
    }
    const distanceToSwipe = -actionAreaSizeMTRef.current
      - currentTransform.current
    const distanceSwipedPercentage = Math.abs(currentTransform.current)
      / actionAreaSizeMTRef.current
    const consumedSwipedTime = isCanceling
      ? 0
      : animationDuration * distanceSwipedPercentage
    const startTime = Date.now()
    clearPreviousSwipeAnimation()
    swipeAnimation(
      startTime,
      currentTransform.current,
      distanceToSwipe,
      consumedSwipedTime,
      true,
    )
  }

  const swipeWithEasingInOut = () => {
    'main thread'
    if (debugLog) {
      console.info(
        swipeActionId,
        'swipeWithEasingInOut, lastMovingDirection',
        lastMovingDirection.current,
      )
    }
    if (lastMovingDirection.current === movingDirection.right) {
      swipeRightToAction(false)
    } else {
      swipeLeftToUndo(false)
    }
  }

  const swipeCancelDueToSmallVelocity = () => {
    'main thread'
    if (
      Math.abs(currentTransform.current)
        > actionAreaSizeMTRef.current * 0.5
    ) {
      swipeRightToAction(true)
    } else {
      swipeLeftToUndo(true)
    }
  }

  const sendSwipeEndJS = () => {
    if (onSwipeEnd) {
      onSwipeEnd(swipeActionId)
    }
  }

  const clearTouchInfo = () => {
    'main thread'
    prevTouchPointX.current = 0
    prevTouchPointY.current = 0
  }

  swipeGesture.onTouchesUp((_event, _manager) => {
    'main thread'
    if (debugLog) {
      console.info(
        'touchEnd',
        swipeActionId,
        enableSwipe,
        prevTouchPointX.current,
      )
    }
    isFirstJudge.current = true
    // don't need to judge if enableSwipe is true or not, whenever there is a touchEnd.
    if (!prevTouchPointX.current) {
      console.error('ERROR! previous touch point is null')
      return
    }

    clearTouchInfo()

    if (debugLog) {
      console.info('scroll end velocity', currentVelocity.current)
    }
    if (isStartWithHorizontal.current) {
      if (Math.abs(currentVelocity.current) > swipeMinimumVelocity.current) {
        swipeWithEasingInOut()
      } else {
        swipeCancelDueToSmallVelocity()
      }
      runOnBackground(sendSwipeEndJS)()
    }
    isStartWithHorizontal.current = false
  })

  const showActionAreaMTS = (animated: boolean) => {
    'main thread'
    if (animated) {
      swipeRightToAction(false)
    } else {
      clearPreviousSwipeAnimation()
      setTransform(-actionAreaSizeMTRef.current)
    }
  }

  const showActionArea = (animated: boolean) => {
    runOnMainThread(showActionAreaMTS)(animated)
    sendSwipeEndJS()
  }

  const closeActionAreaMTS = (animated: boolean) => {
    'main thread'
    if (debugLog) {
      console.info('closeActionAreaMTS', swipeActionId)
    }
    clearPreviousSwipeAnimation()
    if (animated) {
      swipeLeftToUndo(false)
    } else {
      setTransform(0)
    }
  }

  const closeActionArea = (animated: boolean) => {
    runOnMainThread(closeActionAreaMTS)(animated)
  }

  useImperativeHandle(
    ref,
    () => ({
      showActionArea,
      closeActionArea,
    }),
    [showActionArea, closeActionArea],
  )

  return (
    <view
      style={{
        ...style,
        display: 'linear',
        linearOrientation: 'horizontal',
        width: `${totalAreaSize}px`,
      }}
      className={className}
      id={swipeActionId}
      enable-new-animator={false}
      flatten={false}
      main-thread:gesture={swipeGesture}
      main-thread:binduiappear={() => {
        'main thread'
        setTransform(currentTransform.current)
      }}
      ios-enable-simultaneous-touch={iosEnableSimultaneousTouch}
    >
      <view
        id={`${swipeActionId}-displayArea`}
        style={{ height: '100%' }}
        main-thread:binduiappear={() => {
          'main thread'
          setTransform(currentTransform.current)
        }}
        binduiappear={() => {
          lynx
            .createSelectorQuery()
            .select(`#${swipeActionId}-displayArea`)
            .invoke({
              method: 'boundingClientRect',
              success: (res: unknown) => {
                // @ts-expect-error expected
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                setDisplayAreaSize(res.width)
              },
            })
            .exec()
          lynx
            .createSelectorQuery()
            .select(`#${swipeActionId}-actionArea`)
            .invoke({
              method: 'boundingClientRect',
              success: (res: unknown) => {
                // @ts-expect-error expected
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                setActionAreaSize(res.width)
              },
            })
            .exec()
        }}
        main-thread:binduidisappear={() => {
          'main thread'
          setTransformProperty(0)
          clearTouchInfo()
          clearPreviousSwipeAnimation()
          currentTransform.current = 0
          transformStartPosition.current = 0
        }}
      >
        {displayArea}
      </view>
      <view
        id={`${swipeActionId}-actionArea`}
        style={{ height: '100%' }}
        main-thread:bindtap={() => {
          'main thread'
          setTransform(0)
          runOnBackground(onAction)(swipeActionId)
        }}
      >
        {actionArea}
      </view>
    </view>
  )
}
