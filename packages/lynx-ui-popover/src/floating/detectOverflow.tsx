// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  DetectOverflowOptions,
  MiddlewareState,
  SideObject,
} from './floatingTypes'
import { clamp, evaluate, getPaddingObject, standardizeRect } from './utils'

export async function detectOverflow(
  state: MiddlewareState,
  options: DetectOverflowOptions,
): Promise<SideObject> {
  const { x, y, rects, platform } = state
  const { floating, reference } = rects
  const updatedFloating = {
    ...floating,
    x,
    y,
    // biome-ignore lint/style/useExplicitLengthCheck: Expected
    ...(state.middlewareData.size
      ? {
        width: clamp(
          0,
          floating.width,
          state.middlewareData.size.availableWidth,
        ),
        height: clamp(
          0,
          floating.height,
          state.middlewareData.size.availableHeight,
        ),
      }
      : {}),
  }

  const {
    padding = 0,
  } = evaluate(options, state)

  const paddingObject = getPaddingObject(padding)
  const clippingClientRect = standardizeRect(await platform.getClippingRect())
  // Convert the updatedFloating rect to a rect relative to the client.
  const floatingClientRect = standardizeRect({
    x: updatedFloating.x + reference.x,
    y: updatedFloating.y + reference.y,
    width: updatedFloating.width,
    height: updatedFloating.height,
  })

  return {
    top: (clippingClientRect.top - floatingClientRect.top + paddingObject.top),
    bottom: (floatingClientRect.bottom
      - clippingClientRect.bottom
      + paddingObject.bottom),
    left:
      (clippingClientRect.left - floatingClientRect.left + paddingObject.left),
    right: (floatingClientRect.right
      - clippingClientRect.right
      + paddingObject.right),
  }
}
