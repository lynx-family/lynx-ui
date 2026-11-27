// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { MainThread } from '@lynx-js/types'

import type {
  SheetFitBounds,
  SheetFitSnapPoint,
  SheetSide,
  SheetSnapPoint,
} from '../types'

export type SheetResolvedSide = 'top' | 'bottom' | 'left' | 'right'

export function isFitSnapPoint(
  value: SheetSnapPoint,
): value is 'fit' | SheetFitSnapPoint {
  if (typeof value === 'string') {
    return value.trim() === 'fit'
  }
  return (
    typeof value === 'object'
    && value !== null
    && 'fit' in value
    && typeof value.fit === 'object'
    && value.fit !== null
  )
}

export function getFitSnapBounds(
  value: SheetSnapPoint,
): SheetFitBounds | undefined {
  if (!isFitSnapPoint(value) || typeof value === 'string') return undefined
  return value.fit
}

export function toPxJS(value: SheetSnapPoint, viewportSize: number): number {
  if (typeof value === 'number') return value
  if (isFitSnapPoint(value)) return -1
  if (typeof value === 'string') {
    const s = value.trim()
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
  }
  throw new Error(`[Sheet] Invalid snap point: ${String(value)}`)
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
  side: SheetResolvedSide,
): [number, number][] {
  return side === 'top' || side === 'bottom'
    ? DEFAULT_VERTICAL_CLAIMED_GESTURE_ANGLES
    : DEFAULT_HORIZONTAL_CLAIMED_GESTURE_ANGLES
}

export function resolveSheetSide(
  side: SheetSide,
  enableRTL = false,
): SheetResolvedSide {
  if (side === 'start') {
    return enableRTL ? 'right' : 'left'
  }
  if (side === 'end') {
    return enableRTL ? 'left' : 'right'
  }
  return side
}

export function isHorizontalSide(side: SheetResolvedSide) {
  'main thread'
  return side === 'left' || side === 'right'
}

export function getDefaultRubberBand(side: SheetResolvedSide) {
  return side !== 'left' && side !== 'right'
}

export function getMainAxisSize(
  side: SheetResolvedSide,
  dimensions: { screenHeight: number, screenWidth: number },
) {
  return side === 'left' || side === 'right'
    ? dimensions.screenWidth
    : dimensions.screenHeight
}

export function getMainAxisLayoutSize(
  side: SheetResolvedSide,
  event: {
    detail?: { height?: number, width?: number }
    params?: { height?: number, width?: number }
  },
) {
  'main thread'
  return isHorizontalSide(side)
    ? event.detail?.width ?? event.params?.width ?? 0
    : event.detail?.height ?? event.params?.height ?? 0
}

export function getMaxSnapSize(
  snapPoints: number[],
  fitSize = 0,
) {
  let max = fitSize
  for (const snapPoint of snapPoints) {
    const value = snapPoint === -1 ? fitSize : snapPoint
    if (value > max) {
      max = value
    }
  }
  return max
}

export function getMainAxisTouchCoordinate(
  side: SheetResolvedSide,
  detail: Pick<MainThread.TouchEvent['detail'], 'x' | 'y'>,
) {
  'main thread'
  return isHorizontalSide(side) ? detail.x : detail.y
}

export function getNextMainAxisOffset(
  side: SheetResolvedSide,
  startOffset: number,
  delta: number,
) {
  'main thread'
  if (side === 'top' || side === 'left') {
    return startOffset + delta
  }
  return startOffset - delta
}

export function getSheetTransform(
  side: SheetResolvedSide,
  value: number,
) {
  'main thread'
  if (side === 'bottom') {
    return `translate(0px, ${-value}px)`
  }
  if (side === 'top') {
    return `translate(0px, ${value}px)`
  }
  if (side === 'left') {
    return `translate(${value}px, 0px)`
  }
  return `translate(${-value}px, 0px)`
}

export function getDefaultScreenSize(): { width: number, height: number } {
  const lynxGlobal = globalThis as unknown as {
    lynx?: {
      __globalProps?: { screenWidth?: number, screenHeight?: number }
    }
    SystemInfo?: {
      pixelWidth?: number
      pixelHeight?: number
      pixelRatio?: number
    }
  }
  const globalWidth = lynxGlobal.lynx?.__globalProps?.screenWidth
  const globalHeight = lynxGlobal.lynx?.__globalProps?.screenHeight
  const sysInfo = lynxGlobal.SystemInfo
  const ratio = sysInfo?.pixelRatio
  const sysWidth = ratio && ratio > 0 && sysInfo.pixelWidth
    ? sysInfo.pixelWidth / ratio
    : undefined
  const sysHeight = ratio && ratio > 0 && sysInfo.pixelHeight
    ? sysInfo.pixelHeight / ratio
    : undefined
  return {
    width: globalWidth ?? sysWidth ?? 375,
    height: globalHeight ?? sysHeight ?? 500,
  }
}
