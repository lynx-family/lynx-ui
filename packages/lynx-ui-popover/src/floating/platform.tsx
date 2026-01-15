// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  getRectById,
  getRectByRef,
  screenHeight,
  screenWidth,
} from '@lynx-js/lynx-ui-common'

import type { FindElementBy, Platform, Rect } from './floatingTypes'

export const popoverPlatform = (
  floatingRect: Rect,
  referenceRect: Rect,
  arrowRect: Rect,
  alternativeReference?: Rect, // If the anchor is set, use the alternativeReference
): Platform => ({
  getClippingRect(element?: FindElementBy) {
    if (element && typeof element === 'string') {
      getRectById(element, true).then((rect) => {
        return rect
      })
    } else if (element && element instanceof Object && 'current' in element) {
      getRectByRef(element, true).then((rect) => {
        return rect
      })
    }
    return {
      x: 0,
      y: 0,
      width: screenWidth,
      height: screenHeight,
    }
  },

  getDimensions(element: 'floating' | 'reference' | 'arrow') {
    switch (element) {
      case 'floating':
        return { width: floatingRect.width, height: floatingRect.height }
      case 'reference':
        return {
          width: alternativeReference?.width ?? referenceRect.width,
          height: alternativeReference?.height ?? referenceRect.height,
        }
      case 'arrow':
        return { width: arrowRect.width, height: arrowRect.height }
    }
  },

  getElementRects() {
    return {
      floating: floatingRect,
      reference: alternativeReference ?? referenceRect,
    }
  },

  // (TODO) fangzhou.fz: implement this later
  isRTL(_element?: unknown) {
    return false
  },
})
