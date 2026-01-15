// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { detectOverflow } from './detectOverflow'
import type {
  Coords,
  Derivable,
  LimitShiftOptions,
  Middleware,
  MiddlewareState,
  ShiftOptions,
} from './floatingTypes'
import { clamp, evaluate, getOppositeAxis, getSide, getSideAxis } from './utils'

export const shift = (
  options: ShiftOptions | Derivable<ShiftOptions> = {},
): Middleware => ({
  name: 'shift',
  options,
  async fn(state) {
    const { x, y, placement } = state

    const {
      mainAxis: checkMainAxis = true,
      crossAxis: checkCrossAxis = false,
      limiter = { fn: ({ x, y }: Coords) => ({ x, y }) },
      ...detectOverflowOptions
    } = evaluate(options, state)

    const coords = { x, y }
    const overflow = await detectOverflow(state, detectOverflowOptions)
    const crossAxis = getSideAxis(getSide(placement))
    const mainAxis = getOppositeAxis(crossAxis)

    let mainAxisCoord = coords[mainAxis]
    let crossAxisCoord = coords[crossAxis]

    if (checkMainAxis) {
      const minSide = mainAxis === 'y' ? 'top' : 'left'
      const maxSide = mainAxis === 'y' ? 'bottom' : 'right'
      const min = mainAxisCoord + overflow[minSide]
      const max = mainAxisCoord - overflow[maxSide]

      mainAxisCoord = clamp(min, mainAxisCoord, max)
    }

    if (checkCrossAxis) {
      const minSide = crossAxis === 'y' ? 'top' : 'left'
      const maxSide = crossAxis === 'y' ? 'bottom' : 'right'
      const min = crossAxisCoord + overflow[minSide]
      const max = crossAxisCoord - overflow[maxSide]

      crossAxisCoord = clamp(min, crossAxisCoord, max)
    }

    const limitedCoords = limiter.fn({
      ...state,
      [mainAxis]: mainAxisCoord,
      [crossAxis]: crossAxisCoord,
    })

    return {
      ...limitedCoords,
      data: {
        x: limitedCoords.x - x,
        y: limitedCoords.y - y,
        enabled: {
          [mainAxis]: checkMainAxis,
          [crossAxis]: checkCrossAxis,
        },
      },
    }
  },
})

// The calculation differs from the original logic in floating-ui.
// Since Lynx doesn't support position: static and makes all views positioned relatively by default, it's not easy to make an absolutely positioned view layout itself 'relative' to what it actually needs, while ignoring all the parent nodes that are default set to 'relative' between them.
// The original floating-ui actually returns the coordinates of the floating element relative to the viewport, but we can't apply this coordinates correctly as it will be blocked by nearer 'relative' views. Unless we use 'fixed'. But a fixed view can't scroll together with reference view inside a scrollable container.
// We do the calculation here by making the floating element layout itself relative to the reference element to make sure them positioned correctly.
export const limitShift = (
  options: LimitShiftOptions | Derivable<LimitShiftOptions> = {},
): {
  options: unknown
  fn: (state: MiddlewareState) => Coords
} => ({
  options,
  fn(state) {
    const { x, y, placement, rects, middlewareData } = state

    const {
      offset = 0,
      mainAxis: checkMainAxis = true,
      crossAxis: checkCrossAxis = true,
    } = evaluate(options, state)

    const coords = { x, y }
    const crossAxis = getSideAxis(placement)
    const mainAxis = getOppositeAxis(crossAxis)

    // Here's the difference. In floating-ui the referenceY and referenceX is reference element's x and y.
    const { width, height } = rects.reference
    const reference = { x: 0, y: 0, width, height }

    let mainAxisCoord = coords[mainAxis]
    let crossAxisCoord = coords[crossAxis]

    const rawOffset = evaluate(offset, state)
    const computedOffset = typeof rawOffset === 'number'
      ? { mainAxis: rawOffset, crossAxis: 0 }
      : { mainAxis: 0, crossAxis: 0, ...rawOffset }

    if (checkMainAxis) {
      const len = mainAxis === 'y' ? 'height' : 'width'
      const limitMin = reference[mainAxis]
        - rects.floating[len]
        + computedOffset.mainAxis
      const limitMax = reference[mainAxis]
        + reference[len]
        - computedOffset.mainAxis

      if (mainAxisCoord < limitMin) {
        mainAxisCoord = limitMin
      } else if (mainAxisCoord > limitMax) {
        mainAxisCoord = limitMax
      }
    }

    if (checkCrossAxis) {
      const len = mainAxis === 'y' ? 'width' : 'height'
      const isOriginSide = ['top', 'left'].includes(getSide(placement))
      const limitMin = reference[crossAxis]
        - rects.floating[len]
        + (isOriginSide ? middlewareData.offset?.[crossAxis] ?? 0 : 0)
        + (isOriginSide ? 0 : computedOffset.crossAxis)
      const limitMax = reference[crossAxis]
        + reference[len]
        + (isOriginSide ? 0 : middlewareData.offset?.[crossAxis] ?? 0)
        - (isOriginSide ? computedOffset.crossAxis : 0)

      if (crossAxisCoord < limitMin) {
        crossAxisCoord = limitMin
      } else if (crossAxisCoord > limitMax) {
        crossAxisCoord = limitMax
      }
    }

    return {
      [mainAxis]: mainAxisCoord,
      [crossAxis]: crossAxisCoord,
    } as Coords
  },
})
