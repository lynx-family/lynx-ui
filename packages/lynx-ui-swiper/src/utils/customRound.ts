// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Round with threshold other than 0.5
 * eg: customRound(1.8, 0.7) === 2
 * eg: customRound(1.6, 0.7) === 1
 * @param num
 * @param threshold
 * @returns number
 */
export function customRound(num: number, threshold = 0.5) {
  'main thread'
  const decimal = num - Math.floor(num)

  // Check if the decimal part is greater than or equal to 0.9
  if (decimal >= threshold) {
    return Math.ceil(num)
  } else {
    return Math.floor(num)
  }
}
