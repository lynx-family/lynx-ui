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
  const direction = (compOrder - mid) > 0 ? 1 : -1
  const theta = ((compOrder - mid) * 20 + direction * focusedIndex * 2)
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
    ? (escape ? 0 : 1 - Math.abs(theta * 2 / Math.PI) * 0.6)
    : 0

  return {
    world,
    zIndex,
    maskOpacity: maskOpacity * 0.5,
  }
}
