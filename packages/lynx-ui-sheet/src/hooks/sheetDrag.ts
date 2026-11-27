// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { SheetRootProps } from '../types'
import { rubberEffect } from '../utils'

export interface SheetRubberBandConfig {
  enabled: boolean
  coeff: number
  max: number
}

export interface SheetDragState {
  rawPosition: number
  position: number
  minimum: number
  maximum: number
  rubber: SheetRubberBandConfig
  enableDragToClose: boolean
}

export function getRubberBandConfig(
  rubberBand: SheetRootProps['rubberBand'],
  viewportSize: number,
  sheetSize: number,
): SheetRubberBandConfig {
  'main thread'
  if (rubberBand === false) return { enabled: false, coeff: 0, max: 0 }
  const coeff = typeof rubberBand === 'number'
    ? rubberBand
    : (typeof rubberBand === 'object' ? (rubberBand.coeff ?? 0.5) : 0.5)
  const defaultMax = Math.max(0, Math.min(80, viewportSize - sheetSize))
  const max = typeof rubberBand === 'object'
    ? (rubberBand.max ?? defaultMax)
    : defaultMax
  return { enabled: true, coeff, max }
}

function restoreRawDistance(distance: number, rubber: SheetRubberBandConfig) {
  'main thread'
  if (!rubber.enabled || rubber.max <= 0 || rubber.coeff <= 0) return distance
  return distance * rubber.max
    / (rubber.coeff * (rubber.max - Math.abs(distance)))
}

// Sample resistance geometry when Sheet acquires the drag, not on every frame.
export function createSheetDragState(
  position: number,
  offsets: number[],
  rubberBand: SheetRootProps['rubberBand'],
  viewportSize: number,
  enableDragToClose: boolean,
): SheetDragState | null {
  'main thread'
  const valid = offsets.filter(offset => offset !== -1)
  if (valid.length === 0) return null
  const minimum = Math.min(...valid)
  const maximum = Math.max(...valid)
  const rubber = getRubberBandConfig(rubberBand, viewportSize, maximum)
  const stretch = position > maximum
    ? position - maximum
    : (enableDragToClose ? 0 : Math.max(0, minimum - position))
  // A spring may overshoot farther than the configured resistance range.
  // Fit that existing stretch before inverting the curve, avoiding a jump
  // when the finger takes over. Ordinary drags keep the configured range.
  if (rubber.enabled && rubber.max > 0 && stretch >= rubber.max) {
    rubber.max += stretch
  }
  let rawPosition = position
  if (position > maximum) {
    rawPosition = maximum + restoreRawDistance(position - maximum, rubber)
  } else if (position < minimum && !enableDragToClose) {
    rawPosition = minimum + restoreRawDistance(position - minimum, rubber)
  }
  return { rawPosition, position, minimum, maximum, rubber, enableDragToClose }
}

// Apply each pointer delta to raw displacement, never to the resisted output.
export function moveSheetDrag(
  state: SheetDragState,
  delta: number,
  handoffMaximum?: number,
): SheetDragState {
  'main thread'
  if (delta === 0) return state
  let rawPosition = state.rawPosition + delta
  // Native scrolling owns further expansion at this boundary. Do not retain
  // its displacement as Sheet over-drag when the finger later reverses.
  if (handoffMaximum !== undefined) {
    rawPosition = Math.min(rawPosition, handoffMaximum)
  }
  let position = rawPosition
  const { minimum, maximum, rubber, enableDragToClose } = state
  if (position > maximum && handoffMaximum === undefined) {
    position = rubber.enabled
      ? maximum + rubberEffect(position - maximum, rubber.max, rubber.coeff)
      : maximum
  }
  if (position < minimum && !enableDragToClose) {
    position = rubber.enabled
      ? minimum + rubberEffect(position - minimum, rubber.max, rubber.coeff)
      : minimum
  }
  return { ...state, rawPosition, position }
}
