// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { OffsetLimitResult } from '../types'

function easeOut(progress) {
  'main thread'
  return 1 - Math.pow(1 - progress, 3)
}

function limiter(
  offset: number,
  dataCount: number,
  size: number,
  spaceBetween: number,
  loop: boolean,
  offsetLimit: OffsetLimitResult,
): number {
  if (dataCount === 0) {
    return 0
  }
  if (!loop) {
    if (offset >= -offsetLimit.startLimit) {
      return -offsetLimit.startLimit
    } else if (
      offset
        < -(size + spaceBetween) * (dataCount - 1) + spaceBetween
          + offsetLimit.endLimit
    ) {
      return -(size + spaceBetween) * (dataCount - 1) + spaceBetween
        + offsetLimit.startLimit
    }
  }

  return offset
}

/**
 * limiter is used for useOffset
 * When mode === 'normal', different aligns are applied an alignOffset based on realOffset returned by useOffset
 * We first remove the offset, and use limiter to get the realOffset from useOffset
 * And then applied alignOffset back, to make the position right.
 */
function limiterForFirstScreen(
  offset: number,
  dataCount: number,
  size: number,
  spaceBetween: number,
  loop: boolean,
  offsetLimit: OffsetLimitResult,
  alignOffset: number,
) {
  return (
    alignOffset
    + limiter(
      offset - alignOffset,
      dataCount,
      size,
      spaceBetween,
      loop,
      offsetLimit,
    )
  )
}

function limiterMTS(
  offset: number,
  dataCount: number,
  size: number,
  loop: boolean,
  offsetLimit: OffsetLimitResult,
) {
  'main thread'
  let reachingLimit = false
  let finalOffset = offset
  if (!loop) {
    if (offset >= offsetLimit.startLimit) {
      reachingLimit = true
      finalOffset = offsetLimit.startLimit
    } else if (offset <= -size * (dataCount - 1) + offsetLimit.endLimit) {
      reachingLimit = true
      finalOffset = -size * (dataCount - 1) + offsetLimit.endLimit
    }
  }
  return { offset: finalOffset, reachingLimit }
}

const EPSILON = 1e-10

export function fixPrecisionMT(num: number): number {
  'main thread'
  // Use a small epsilon value to handle floating point precision
  const epsilon = 0.000001
  // Round to the nearest integer if the number is very close to an integer
  if (Math.abs(num - Math.round(num)) < epsilon) {
    return Math.round(num)
  }
  return num
}

export function safeEqualMT(a: number, b: number, epsilon = EPSILON) {
  'main thread'
  return Math.abs(a - b) < epsilon
}

export function eqOrGtMT(a: number, b: number, epsilon = EPSILON) {
  'main thread'
  return Math.abs(a - b) < epsilon || a > b
}

export function eqOrLtMT(a: number, b: number, epsilon = EPSILON) {
  'main thread'
  return Math.abs(a - b) < epsilon || a < b
}

export { easeOut, limiter, limiterMTS, limiterForFirstScreen }
