// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { StudioViewMode } from '../types'

export interface WorldPos {
  x: number
  y: number
  z: number
}

export interface StageWorldState {
  world: WorldPos
  zIndex: number
  maskOpacity: number
}

const WORLD_ORIGIN: WorldPos = { x: 0, y: 0, z: 0 }

function getOrderDirection(orderOffset: number): -1 | 0 | 1 {
  // Centered stages should not receive a focus-index angle offset.
  if (orderOffset === 0) return 0
  return orderOffset > 0 ? 1 : -1
}

/**
 * Resolves the presentation transform for a stage.
 *
 * In focus mode, `escape` marks the active focused stage, which stays centered,
 * elevated, and unmasked. Non-focused stages use `compOrder` to fan out around
 * that active stage, while `focusedIndex` adds a small rotation offset so focus
 * transitions preserve a sense of direction.
 */
export function getStageWorldState({
  mode,
  compOrder,
  mid,
  focusedIndex,
  escape,
}: {
  mode: StudioViewMode
  compOrder: number
  mid: number
  focusedIndex: number
  escape: boolean
}): StageWorldState {
  const orderOffset = compOrder - mid
  const direction = getOrderDirection(orderOffset)
  const theta = (orderOffset * 20 + direction * focusedIndex * 2)
    / 180 * Math.PI

  const world: WorldPos = mode === 'focus'
    ? {
      x: escape ? 0 : Math.sin(theta) * 600,
      y: 0,
      z: escape ? 0 : -Math.cos(theta) * 600,
    }
    : WORLD_ORIGIN

  const zIndex = mode === 'focus'
    ? (escape ? 100 : Math.ceil(Math.abs(compOrder - mid) * 2))
    : 0

  const maskOpacity = mode === 'focus'
    ? (
      escape
        ? 0
        : Math.max(
          0,
          Math.min(1, (1 - Math.abs(theta * 2 / Math.PI) * 0.6) * 0.5),
        )
    )
    : 0

  return {
    world,
    zIndex,
    maskOpacity,
  }
}
