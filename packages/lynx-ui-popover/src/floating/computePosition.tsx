// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { computeCoordsFromPlacement } from './computeCoordsFromPlacement'
import type {
  ComputePosition,
  Middleware,
  MiddlewareData,
} from './floatingTypes'

export const computePosition: ComputePosition = async (
  reference,
  floating,
  config,
) => {
  const {
    placement = 'bottom',
    strategy = 'absolute',
    middleware = [],
    platform,
  } = config

  const validMiddleware = middleware.filter(Boolean) as Middleware[]
  const rtl = await platform.isRTL?.(floating)

  let rects = await platform.getElementRects()
  let { x, y } = computeCoordsFromPlacement(rects, placement, rtl)
  let statefulPlacement = placement
  let middlewareData: MiddlewareData = {}
  let resetCount = 0

  // biome-ignore lint/style/useForOf: <explanation>
  for (let i = 0; i < validMiddleware.length; i++) {
    const { name, fn } = validMiddleware[i]

    const {
      x: nextX,
      y: nextY,
      data,
      reset,
    } = await fn({
      x,
      y,
      initialPlacement: placement,
      placement: statefulPlacement,
      strategy,
      middlewareData,
      rects,
      platform,
      elements: { reference, floating },
    })

    x = nextX ?? x
    y = nextY ?? y

    middlewareData = {
      ...middlewareData,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [name]: {
        ...middlewareData[name],
        ...data,
      },
    }

    if (reset && resetCount <= 50) {
      resetCount++

      if (typeof reset === 'object') {
        if (reset.placement) {
          statefulPlacement = reset.placement
        }

        if (reset.rects) {
          rects = reset.rects === true
            // Actually here the getElementRects can not get the latest layout of the element because in Lynx the layout is on another thread.
            // To avoid adding more complexity in waiting for the layout to be ready(and we can't associate the a specific layoutchange event with this update), we do the rect updates in detectOverflow.
            ? await platform.getElementRects()
            : reset.rects
        }

        ;({ x, y } = computeCoordsFromPlacement(rects, statefulPlacement, rtl))
      }

      i = -1
    }
  }

  return {
    x,
    y,
    placement: statefulPlacement,
    strategy,
    middlewareData,
  }
}
