// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  Alignment,
  Axis,
  ClientRectObject,
  Length,
  Padding,
  Placement,
  Rect,
  Side,
  SideObject,
} from './floatingTypes'

export function getSide(placement: Placement): Side {
  return placement.split('-')[0] as Side
}

export function getSideAxis(placement: Placement): Axis {
  return ['top', 'bottom'].includes(getSide(placement)) ? 'y' : 'x'
}

export function getOppositeAxis(axis: Axis): Axis {
  return axis === 'x' ? 'y' : 'x'
}

export function getAlignmentAxis(placement: Placement): Axis {
  return getOppositeAxis(getSideAxis(placement))
}

export function getAxisLength(axis: Axis): Length {
  return axis === 'y' ? 'height' : 'width'
}

export function getAlignment(placement: Placement): Alignment | undefined {
  return placement.split('-')[1] as Alignment | undefined
}

export function evaluate<T, P>(value: T | ((param: P) => T), param: P): T {
  return typeof value === 'function'
    ? (value as (param: P) => T)(param)
    : value
}

export function expandPaddingObject(padding: Partial<SideObject>): SideObject {
  return { top: 0, right: 0, bottom: 0, left: 0, ...padding }
}

export function getPaddingObject(padding: Padding): SideObject {
  return typeof padding === 'number'
    ? { top: padding, right: padding, bottom: padding, left: padding }
    : expandPaddingObject(padding)
}

export function clamp(start: number, value: number, end: number): number {
  return Math.max(start, Math.min(value, end))
}

export function standardizeRect(rect: Rect): ClientRectObject {
  const { x, y, width, height } = rect
  return {
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    x,
    y,
  }
}
