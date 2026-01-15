// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnBackground, useMainThreadRef } from '@lynx-js/react'
import type { RefObject } from '@lynx-js/react'

import type { Point } from '@lynx-js/lynx-ui-common'
import type { MainThread } from '@lynx-js/types'

import type {
  basicDirections,
  directions,
  useDragOptions,
} from './types/index.docs'

export interface useDragInternalOptions {
  /**
   * The main-thread:ref of the draggable node.
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 可拖动节点的 main-thread:ref
   */
  draggableNodeRef: RefObject<MainThread.Element | null>
}

export interface useDraggableEventsHandlers {
  'main-thread:bindlongpress'?: (
    event: MainThread.TouchEvent | MainThread.MouseEvent,
  ) => void
  'main-thread:bindmouselongpress'?: (
    event: MainThread.TouchEvent | MainThread.MouseEvent,
  ) => void
  'main-thread:bindtouchstart'?: (
    event: MainThread.TouchEvent | MainThread.MouseEvent,
  ) => void
  'main-thread:bindmousedown'?: (
    event: MainThread.TouchEvent | MainThread.MouseEvent,
  ) => void
  'main-thread:bindtouchmove': (
    event: MainThread.TouchEvent | MainThread.MouseEvent,
  ) => void
  'main-thread:bindtouchend': (
    event: MainThread.TouchEvent | MainThread.MouseEvent,
  ) => void
  'main-thread:bindmousemove': (
    event: MainThread.TouchEvent | MainThread.MouseEvent,
  ) => void
  'main-thread:bindmouseup': (
    event: MainThread.TouchEvent | MainThread.MouseEvent,
  ) => void
  'main-thread:bindmouseleave': (
    event: MainThread.TouchEvent | MainThread.MouseEvent,
  ) => void
}

export interface UseDraggableReturnType {
  eventHandlers: useDraggableEventsHandlers | Record<string, never>
  utils: {
    setTransform: (x: number, y: number) => void
    setStyleProperties: (styles: Record<string, string>) => void
    resetInternalValues: () => void
  }
}

export const useDraggable = (
  options: useDragOptions & useDragInternalOptions,
): UseDraggableReturnType => {
  const {
    draggableNodeRef,
    enableDragging = true,
    minTranslateX,
    maxTranslateX,
    minTranslateY,
    maxTranslateY,
    allowedDirection = 'all',
    onDragStart,
    onDragEnd,
    onDragging,
    onMTSDragEnd,
    onMTSDragStart,
    onMTSDragging,
    resetOnEnd = false,
    trigger = 'longpress',
  } = options
  const currentTranslate = useMainThreadRef<Point>({ x: 0, y: 0 })
  const transitionAtTouchStart = useMainThreadRef<Point>({ x: 0, y: 0 })
  const touchStartPoint = useMainThreadRef<
    MainThread.TouchEvent | MainThread.MouseEvent | null
  >(null)

  const directionInclude = (
    direction: basicDirections,
    givenDirections: directions,
  ) => {
    if (Array.isArray(givenDirections)) {
      return givenDirections.includes(direction)
    }
    return givenDirections === direction || givenDirections === 'all'
  }

  // pitfall: Do not use Number.NEGATIVE_INFINITY or Number.POSITIVE_INFINITY here because currently it can not be serialization in ReactLynx, which might cause this mainThreadRef.current to be null
  const minX = minTranslateX
    ?? (directionInclude('left', allowedDirection)
      ? Number.MIN_SAFE_INTEGER
      : 0)
  const translateXLowerBound = allowedDirection === 'none' ? 0 : minX

  const maxX = maxTranslateX
    ?? (directionInclude('right', allowedDirection)
      ? Number.MAX_SAFE_INTEGER
      : 0)
  const translateXUpperBound = allowedDirection === 'none' ? 0 : maxX

  const minY = minTranslateY
    ?? (directionInclude('up', allowedDirection) ? Number.MIN_SAFE_INTEGER : 0)
  const translateYLowerBound = allowedDirection === 'none' ? 0 : minY

  const maxY = maxTranslateY
    ?? (directionInclude('down', allowedDirection)
      ? Number.MAX_SAFE_INTEGER
      : 0)
  const translateYUpperBound = allowedDirection === 'none' ? 0 : maxY

  const getPagePoint = (
    event: MainThread.TouchEvent | MainThread.MouseEvent,
  ) => {
    'main thread'
    if ('touches' in event && 'touches') {
      return { x: event.touches[0].pageX, y: event.touches[0].pageY }
    }
    if ('button' in event) {
      return { x: event.pageX, y: event.pageY }
    }
    return { x: 0, y: 0 }
  }

  const getCurrentDelta: (
    event: MainThread.TouchEvent | MainThread.MouseEvent,
  ) => Point = (
    event,
  ) => {
    'main thread'
    if (touchStartPoint.current) {
      if ('touches' in event && 'touches' in touchStartPoint.current) { // MainThread.TouchEvent
        return {
          x: getPagePoint(event).x - getPagePoint(touchStartPoint.current).x,
          y: getPagePoint(event).y - getPagePoint(touchStartPoint.current).y,
        }
      }
      if ('button' in event && 'button' in touchStartPoint.current) { // MainThread.MouseEvent
        return {
          x: getPagePoint(event).x - getPagePoint(touchStartPoint.current).x,
          y: getPagePoint(event).y - getPagePoint(touchStartPoint.current).y,
        }
      }
    }
    return { x: 0, y: 0 }
  }

  const clamp = (value: number, min: number, max: number): number => {
    'main thread'
    return Math.min(Math.max(value, min), max)
  }

  const resetInternalValues = () => {
    'main thread'
    touchStartPoint.current = null
    currentTranslate.current = { x: 0, y: 0 }
  }

  const setTransform = (x: number, y: number) => {
    'main thread'
    currentTranslate.current = { x, y }
    draggableNodeRef.current?.setStyleProperty(
      'transform',
      `translate(${x}px, ${y}px)`,
    )
  }

  const setStyleProperties = (styles: Record<string, string>) => {
    'main thread'
    draggableNodeRef.current?.setStyleProperties(styles)
  }

  const onDragStartJS = (pagePoint: Point) => {
    onDragStart?.(pagePoint)
  }
  const handleDragStart = (
    event: MainThread.TouchEvent | MainThread.MouseEvent,
  ) => {
    'main thread'
    touchStartPoint.current = event
    transitionAtTouchStart.current = currentTranslate.current
    onMTSDragStart?.(getPagePoint(event), event)
    runOnBackground(onDragStartJS)(getPagePoint(event))
  }

  const onDraggingJS = (translate: Point) => {
    onDragging?.(translate)
  }
  const handleDragMove = (
    event: MainThread.TouchEvent | MainThread.MouseEvent,
  ) => {
    'main thread'
    const delta = getCurrentDelta(event)
    const deltaX = clamp(
      delta.x,
      translateXLowerBound,
      translateXUpperBound,
    )
    const deltaY = clamp(
      delta.y,
      translateYLowerBound,
      translateYUpperBound,
    )

    const targetX = transitionAtTouchStart.current?.x + deltaX
    const targetY = transitionAtTouchStart.current?.y + deltaY
    setTransform(targetX, targetY)
    onMTSDragging?.(currentTranslate.current, event)
    runOnBackground(onDraggingJS)(currentTranslate.current)
  }

  const onDragEndJS = (translate: Point) => {
    onDragEnd?.(translate)
  }
  const handleDragEnd = (
    event: MainThread.TouchEvent | MainThread.MouseEvent,
  ) => {
    'main thread'
    if (resetOnEnd) {
      setTransform(0, 0)
    }
    onMTSDragEnd?.(currentTranslate.current, event)
    runOnBackground(onDragEndJS)(currentTranslate.current)
  }

  if (!enableDragging) {
    return {
      eventHandlers: {},
      utils: {
        setTransform: () => {
          'main thread'
        },
        setStyleProperties: () => {
          'main thread'
        },
        resetInternalValues: () => {
          'main thread'
        },
      },
    }
  }

  const commonHandlers = {
    'main-thread:bindtouchmove': handleDragMove,
    'main-thread:bindtouchend': handleDragEnd,

    'main-thread:bindmousemove': handleDragMove,
    'main-thread:bindmouseup': handleDragEnd,
    'main-thread:bindmouseleave': handleDragEnd,
  }

  if (trigger === 'longpress') {
    return {
      eventHandlers: {
        'main-thread:bindlongpress': handleDragStart,
        'main-thread:bindmouselongpress': handleDragStart,
        ...commonHandlers,
      },
      utils: {
        setTransform,
        setStyleProperties,
        resetInternalValues,
      },
    }
  }

  return {
    eventHandlers: {
      'main-thread:bindtouchstart': handleDragStart,
      'main-thread:bindmousedown': handleDragStart,
      ...commonHandlers,
    },
    utils: {
      setTransform,
      setStyleProperties,
      resetInternalValues,
    },
  }
}
