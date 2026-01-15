// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ArrowOptions, Derivable, Middleware } from './floatingTypes'
import {
  clamp,
  evaluate,
  getAlignment,
  getAlignmentAxis,
  getAxisLength,
  getPaddingObject,
  standardizeRect,
} from './utils'

// The calculation differs from the original logic in floating-ui.
// Since Lynx doesn't support position: static and makes all views positioned relatively by default, it's not easy to make an absolutely positioned view layout itself 'relative' to what it actually needs, while ignoring all the parent nodes that are default set to 'relative' between them.
// The original floating-ui actually returns the coordinates of the floating element relative to the viewport, but we can't apply this coordinates correctly as it will be blocked by nearer 'relative' views. Unless we use 'fixed'. But a fixed view can't scroll together with reference view inside a scrollable container.
// We do the calculation here by making the floating element layout itself relative to the reference element to make sure them positioned correctly.
export const arrow = (
  options?: ArrowOptions | Derivable<ArrowOptions>,
): Middleware => ({
  name: 'arrow',
  options,
  async fn(state) {
    const { x, y, placement, rects, platform, middlewareData } = state
    // Since `element` is required, we don't Partial<> the type.
    const { padding = 0 } = evaluate(options, state) ?? {}

    // Here's the difference. In floating-ui the referenceY and referenceX is reference element's x and y.
    const { width, height } = rects.reference
    const reference = { x: 0, y: 0, width, height }

    const paddingObject = getPaddingObject(padding)
    const coords = { x, y }
    const axis = getAlignmentAxis(placement)
    const length = getAxisLength(axis)
    const arrowDimensions = await platform.getDimensions('arrow')
    const isYAxis = axis === 'y'
    const minProp = isYAxis ? 'top' : 'left'
    const maxProp = isYAxis ? 'bottom' : 'right'
    const clientProp = isYAxis ? 'height' : 'width'

    const endDiff = reference[length]
      + reference[axis]
      - coords[axis]
      - rects.floating[length]
    const startDiff = coords[axis] - reference[axis]

    const clientRect = standardizeRect({
      x,
      y,
      width: rects.floating.width,
      height: rects.floating.height,
    })
    const clientSize = clientRect?.[clientProp] ?? 0

    const centerToReference = endDiff / 2 - startDiff / 2

    // If the padding is large enough that it causes the arrow to no longer be
    // centered, modify the padding so that it is centered.
    const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2
      - 1
    const minPadding = Math.min(paddingObject[minProp], largestPossiblePadding)
    const maxPadding = Math.min(paddingObject[maxProp], largestPossiblePadding)

    // Make sure the arrow doesn't overflow the floating element if the center
    // point is outside the floating element's bounds.
    const min = minPadding
    const max = clientSize - arrowDimensions[length] - maxPadding
    const center = clientSize / 2 - arrowDimensions[length] / 2
      + centerToReference
    const offset = clamp(min, center, max)

    // If the reference is small enough that the arrow's padding causes it to
    // to point to nothing for an aligned placement, adjust the offset of the
    // floating element itself. To ensure `shift()` continues to take action,
    // a single reset is performed when this is true.
    const shouldAddOffset = !middlewareData.arrow
      && getAlignment(placement) != null
      && center !== offset
      && rects.reference[length] / 2
            - (center < min ? minPadding : maxPadding)
            - arrowDimensions[length] / 2
        < 0
    const alignmentOffset = shouldAddOffset
      ? (center < min
        ? center - min
        : center - max)
      : 0

    const result = {
      [axis]: coords[axis] + alignmentOffset,
      data: {
        [axis]: offset,
        centerOffset: center - offset - alignmentOffset,
        ...(shouldAddOffset && { alignmentOffset }),
      },
      reset: shouldAddOffset,
    }

    return result
  },
})
