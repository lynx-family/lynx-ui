// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { MainThread } from '@lynx-js/types'

import type { SheetDirection } from '../types'

export function toPxJS(value: number | string, viewportSize: number): number {
  if (typeof value === 'number') return value
  const s = String(value).trim()
  if (s === 'fit') return -1
  const m = /^\d+(?:\.\d+)?%$/.exec(s)
  if (m) {
    return (Number.parseFloat(m[0]) / 100) * viewportSize
  }
  const px = /^\d+(?:\.\d+)?px$/.exec(s)
  if (px) {
    return Number.parseFloat(px[0])
  }
  const num = /^\d+(?:\.\d+)?$/.exec(s)
  if (num) {
    return Number.parseFloat(num[0])
  }
  throw new Error(`[Sheet] Invalid snap point: ${value}`)
}

const DEFAULT_VERTICAL_CLAIMED_GESTURE_ANGLES: [number, number][] = [
  [-134, -46],
  [46, 134],
]

const DEFAULT_HORIZONTAL_CLAIMED_GESTURE_ANGLES: [number, number][] = [
  [-45, 45],
  [135, -135],
]

export function getDefaultClaimedGestureAngles(
  direction: SheetDirection,
): [number, number][] {
  return direction === 'bottom'
    ? DEFAULT_VERTICAL_CLAIMED_GESTURE_ANGLES
    : DEFAULT_HORIZONTAL_CLAIMED_GESTURE_ANGLES
}

export function getMainAxisSize(
  direction: SheetDirection,
  dimensions: { screenHeight: number, screenWidth: number },
) {
  return direction === 'bottom'
    ? dimensions.screenHeight
    : dimensions.screenWidth
}

export function getMainAxisLayoutSize(
  direction: SheetDirection,
  event: {
    detail?: { height?: number, width?: number }
    params?: { height?: number, width?: number }
  },
) {
  'main thread'
  if (direction === 'bottom') {
    return event.detail?.height ?? event.params?.height ?? 0
  }
  return event.detail?.width ?? event.params?.width ?? 0
}

export function getMainAxisTouchCoordinate(
  direction: SheetDirection,
  detail: Pick<MainThread.TouchEvent['detail'], 'x' | 'y'>,
) {
  'main thread'
  return direction === 'bottom' ? detail.y : detail.x
}

export function getNextMainAxisOffset(
  direction: SheetDirection,
  startOffset: number,
  delta: number,
) {
  'main thread'
  if (direction === 'left') {
    return startOffset + delta
  }
  return startOffset - delta
}

export function getSheetTransform(
  direction: SheetDirection,
  value: number,
  viewportSize: number,
) {
  'main thread'
  if (direction === 'bottom') {
    return `translate(0px, ${-value}px)`
  }
  if (direction === 'left') {
    return `translate(${value - viewportSize}px, 0px)`
  }
  return `translate(${viewportSize - value}px, 0px)`
}
