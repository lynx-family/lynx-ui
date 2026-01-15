// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  Coords,
  Middleware,
  MiddlewareState,
  OffsetOptions,
} from './floatingTypes'
import { evaluate, getAlignment, getSide, getSideAxis } from './utils'

export async function convertValueToCoords(
  state: MiddlewareState,
  options: OffsetOptions,
): Promise<Coords> {
  const { placement, platform, elements } = state
  const rtl = await platform.isRTL?.(elements.floating)

  const side = getSide(placement)
  const alignment = getAlignment(placement)
  const isVertical = getSideAxis(placement) === 'y'
  const mainAxisMulti = ['left', 'top'].includes(side) ? -1 : 1
  const crossAxisMulti = rtl && isVertical ? -1 : 1
  const rawValue = evaluate(options, state)

  // eslint-disable-next-line prefer-const
  let { mainAxis, crossAxis, alignmentAxis } = typeof rawValue === 'number'
    ? { mainAxis: rawValue, crossAxis: 0, alignmentAxis: null }
    : {
      mainAxis: rawValue.mainAxis ?? 0,
      crossAxis: rawValue.crossAxis ?? 0,
      alignmentAxis: rawValue.alignmentAxis,
    }

  if (alignment && typeof alignmentAxis === 'number') {
    crossAxis = alignment === 'end' ? alignmentAxis * -1 : alignmentAxis
  }

  return isVertical
    ? { x: crossAxis * crossAxisMulti, y: mainAxis * mainAxisMulti }
    : { x: mainAxis * mainAxisMulti, y: crossAxis * crossAxisMulti }
}

export const offset = (options: OffsetOptions = 0): Middleware => ({
  name: 'offset',
  options,
  async fn(state) {
    const { x, y, placement, middlewareData } = state
    const diffCoords = await convertValueToCoords(state, options)

    // If the placement is the same and the arrow caused an alignment offset
    // then we don't need to change the positioning coordinates.
    if (
      placement === middlewareData.offset?.placement
      && middlewareData.arrow?.alignmentOffset
    ) {
      return {}
    }

    return {
      x: x + diffCoords.x,
      y: y + diffCoords.y,
      data: {
        ...diffCoords,
        placement,
      },
    }
  },
})
