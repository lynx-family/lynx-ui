// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Coords, ElementRects, Placement } from './floatingTypes'
import {
  getAlignment,
  getAlignmentAxis,
  getAxisLength,
  getSide,
  getSideAxis,
} from './utils'

// The calculation differs from the original logic in floating-ui.
// Since Lynx doesn't support position: static and makes all views positioned relatively by default, it's not easy to make an absolutely positioned view layout itself 'relative' to what it actually needs, while ignoring all the parent nodes that are default set to 'relative' between them.
// The original floating-ui actually returns the coordinates of the floating element relative to the viewport, but we can't apply this coordinates correctly as it will be blocked by nearer 'relative' views. Unless we use 'fixed'. But a fixed view can't scroll together with reference view inside a scrollable container.
// We do the calculation here by making the floating element layout itself relative to the reference element to make sure them positioned correctly.
export function computeCoordsFromPlacement(
  { reference, floating }: ElementRects,
  placement: Placement,
  rtl?: boolean,
): Coords {
  const sideAxis = getSideAxis(placement)
  const alignmentAxis = getAlignmentAxis(placement)
  const alignLength = getAxisLength(alignmentAxis)
  const side = getSide(placement)
  const isVertical = sideAxis === 'y'

  // Here's the difference. In floating-ui the referenceY and referenceX is reference element's x and y.
  const referenceY = 0
  const referenceX = 0

  const commonX = referenceX + reference.width / 2 - floating.width / 2
  const commonY = referenceY + reference.height / 2 - floating.height / 2
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2

  let coords: Coords
  switch (side) {
    case 'top':
      coords = { x: commonX, y: referenceY - floating.height }
      break
    case 'bottom':
      coords = { x: commonX, y: referenceY + reference.height }
      break
    case 'right':
      coords = { x: referenceX + reference.width, y: commonY }
      break
    case 'left':
      coords = { x: referenceX - floating.width, y: commonY }
      break
    default:
      coords = { x: referenceX, y: referenceY }
  }

  switch (getAlignment(placement)) {
    case 'start':
      coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1)
      break
    case 'end':
      coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1)
      break
    default:
  }

  return coords
}
