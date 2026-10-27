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
