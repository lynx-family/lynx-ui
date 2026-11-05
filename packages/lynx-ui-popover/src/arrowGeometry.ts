// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Dimensions, Placement } from './floating/floatingTypes'
import { getSide } from './floating/utils'

// Only custom object sizes opt into rectangular geometry. Keep numeric sizes
// and the default border triangle's existing square geometry unchanged.
export function resolveArrowSize(
  size: number | Dimensions,
  custom: boolean,
): Dimensions {
  if (custom && typeof size !== 'number') {
    return {
      width: Math.max(0, Number(size?.width ?? 0)),
      height: Math.max(0, Number(size?.height ?? 0)),
    }
  }
  const length = typeof size === 'number'
    ? size
    : Math.max(0, Number(size?.width ?? 0), Number(size?.height ?? 0))
  return { width: length, height: length }
}

// Input dimensions describe the downward-pointing artwork: width is its base,
// height is its protrusion. The positioned box follows the rotated bounds.
export function getArrowDimensions(
  { width, height }: Dimensions,
  placement: Placement,
): Dimensions {
  const side = getSide(placement)
  return side === 'left' || side === 'right'
    ? { width: height, height: width }
    : { width, height }
}

export function getTransformOrigin(
  placement: Placement,
  floating: Dimensions,
  arrow: {
    coords: { x: number | null, y: number | null }
    dimensions: Dimensions
  },
): string {
  const side = getSide(placement)
  const vertical = side === 'top' || side === 'bottom'
  const { width, height } = arrow.dimensions
  const crossSize = vertical ? floating.width : floating.height
  const coordinate = vertical ? arrow.coords.x : arrow.coords.y
  const cross = width === 0
    ? crossSize / 2
    : (coordinate ?? (crossSize - width) / 2) + width / 2
  const main = side === 'top'
    ? floating.height + height
    : (side === 'left' ? floating.width + height : -height)
  return vertical ? `${cross}px ${main}px` : `${main}px ${cross}px`
}
