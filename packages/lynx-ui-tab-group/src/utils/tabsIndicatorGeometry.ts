// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export function calculateIndicatorPosition(
  offset: number,
  tabKeyArray: string[],
  tabsWidthMap: Record<string, number>,
): { width: number, left: number } | undefined {
  'main thread'
  const maxIndex = tabKeyArray.length - 1
  if (maxIndex < 0) {
    return undefined
  }

  if (!Number.isFinite(offset)) {
    return undefined
  }

  const boundedOffset = Math.max(0, Math.min(offset, maxIndex))
  const leftIdx = Math.floor(boundedOffset)
  const rightIdx = Math.ceil(boundedOffset)

  for (let i = 0; i <= rightIdx; i++) {
    if (typeof tabsWidthMap[tabKeyArray[i]] !== 'number') {
      return undefined
    }
  }

  let leftTotalWidth = 0
  for (let i = 0; i < leftIdx; i++) {
    leftTotalWidth += tabsWidthMap[tabKeyArray[i]] ?? 0
  }

  if (leftIdx === rightIdx) {
    return {
      width: tabsWidthMap[tabKeyArray[leftIdx]] ?? 0,
      left: leftTotalWidth,
    }
  }

  const currentProgressPercent = boundedOffset - leftIdx
  const widthL = tabsWidthMap[tabKeyArray[leftIdx]] ?? 0
  const widthR = tabsWidthMap[tabKeyArray[rightIdx]] ?? 0

  return {
    width: widthL + currentProgressPercent * (widthR - widthL),
    left: leftTotalWidth + currentProgressPercent * widthL,
  }
}
