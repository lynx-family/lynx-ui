// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export const screenWidth = SystemInfo.pixelWidth / SystemInfo.pixelRatio
export const screenHeight = SystemInfo.pixelHeight / SystemInfo.pixelRatio

export function convertToPx(
  value:
    | `${number}px`
    | `${number}rpx`
    | `${number}vw`
    | `${number}vh`
    | undefined,
): number | undefined {
  if (!value) {
    return undefined
  }
  const num = Number.parseFloat(value)

  const unit = value.slice(String(num).length).trim()
  switch (unit) {
    case 'px':
      return num
    case 'rpx':
      return num * (screenWidth / 750)
    case 'vw':
      return num * (screenWidth / 100)
    case 'vh':
      return num * (screenHeight / 100)
  }
}
