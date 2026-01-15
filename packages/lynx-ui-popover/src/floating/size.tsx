// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { detectOverflow } from './detectOverflow'
import type {
  Derivable,
  DetectOverflowOptions,
  Middleware,
  MiddlewareState,
} from './floatingTypes'
import { evaluate, getAlignment, getSide, getSideAxis } from './utils'

export interface SizeOptions extends DetectOverflowOptions {
  /**
   * Function that is called to perform style mutations to the floating element
   * to change its size.
   * @default undefined
   */
  apply?(
    args: MiddlewareState & {
      availableWidth: number
      availableHeight: number
    },
  ): void | Promise<void>
}

export const size = (
  options: SizeOptions | Derivable<SizeOptions> = {},
): Middleware => ({
  name: 'size',
  options,
  async fn(state) {
    const { placement, rects, platform, elements } = state

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { apply, ...detectOverflowOptions } = evaluate(
      options,
      state,
    )

    const overflow = await detectOverflow(state, detectOverflowOptions)
    const side = getSide(placement)
    const alignment = getAlignment(placement)
    const isYAxis = getSideAxis(placement) === 'y'
    const { width, height } = rects.floating

    let heightSide: 'top' | 'bottom'
    let widthSide: 'left' | 'right'

    if (side === 'top' || side === 'bottom') {
      heightSide = side
      widthSide = alignment
          === ((await platform.isRTL?.(elements.floating)) ? 'start' : 'end')
        ? 'left'
        : 'right'
    } else {
      widthSide = side
      heightSide = alignment === 'end' ? 'top' : 'bottom'
    }

    const maximumClippingHeight = height - overflow.top - overflow.bottom
    const maximumClippingWidth = width - overflow.left - overflow.right

    const overflowAvailableHeight = Math.min(
      height - overflow[heightSide],
      maximumClippingHeight,
    )
    const overflowAvailableWidth = Math.min(
      width - overflow[widthSide],
      maximumClippingWidth,
    )

    const noShift = !state.middlewareData.shift

    let availableHeight = overflowAvailableHeight
    let availableWidth = overflowAvailableWidth

    if (state.middlewareData.shift?.enabled.x) {
      availableWidth = maximumClippingWidth
    }
    if (state.middlewareData.shift?.enabled.y) {
      availableHeight = maximumClippingHeight
    }

    if (noShift && !alignment) {
      const xMin = Math.max(overflow.left, 0)
      const xMax = Math.max(overflow.right, 0)
      const yMin = Math.max(overflow.top, 0)
      const yMax = Math.max(overflow.bottom, 0)

      if (isYAxis) {
        availableWidth = width
          - 2
            * (xMin !== 0 || xMax !== 0
              ? xMin + xMax
              : Math.max(overflow.left, overflow.right))
      } else {
        availableHeight = height
          - 2
            * (yMin !== 0 || yMax !== 0
              ? yMin + yMax
              : Math.max(overflow.top, overflow.bottom))
      }
    }

    await apply?.({ ...state, availableWidth, availableHeight })

    // This is a workaround. As the layout won't really complete in apply. We use this data to calculate the rest calculations.
    // const nextDimensions = await platform.getDimensions('floating')

    // if (width !== nextDimensions.width || height !== nextDimensions.height) {
    //   return {
    //     reset: {
    //       rects: true,
    //     },
    //   }
    // }

    return {
      data: { availableWidth, availableHeight },
    }
  },
})
