// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { MainThreadRef, RefObject } from '@lynx-js/react'

import type { ListLayoutCompleteEvent, MainThread } from '@lynx-js/types'

interface useListMaxSizeType {
  handleLayoutCompleted: (e: ListLayoutCompleteEvent) => void
}

export const useMaxSize = (
  scrollOrientation: 'vertical' | 'horizontal',
  listSize: RefObject<number>,
  listMaxSize?: number,
  listMainThreadRef?: MainThreadRef<MainThread.Element | null>,
): useListMaxSizeType | null => {
  if (!listMaxSize) return null
  const isVertical = scrollOrientation === 'vertical'

  const bottommost = (e: ListLayoutCompleteEvent) => {
    'main thread'
    let maxValue = 0
    if (Array.isArray(e.detail.visibleItemAfterUpdate)) {
      for (const item of e.detail.visibleItemAfterUpdate) {
        const sum = isVertical
          ? item.height + item.originY
          : item.width + item.originX
        if (sum > maxValue) {
          maxValue = sum
        }
      }
    }
    return maxValue
  }

  const handleLayoutCompleted = (e: ListLayoutCompleteEvent) => {
    'main thread'
    const bottom = bottommost(e)
    const curListSize = listSize.current ?? 0
    // filter 1px flicker in layout
    const epsilon = 1
    if (Math.abs(curListSize - bottom) > epsilon) {
      if (!listMainThreadRef?.current) return
      isVertical
        ? listMainThreadRef.current.setStyleProperty(
          'height',
          `${Math.min(bottom, listMaxSize)}px`,
        )
        : listMainThreadRef.current.setStyleProperty(
          'width',
          `${Math.min(bottom, listMaxSize)}px`,
        )
    }
  }
  return {
    handleLayoutCompleted,
  }
}
