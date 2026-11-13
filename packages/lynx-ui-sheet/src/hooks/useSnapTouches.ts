// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { useMainThreadRef } from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import type { MotionValue } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import {
  clamp,
  findNearestSnap,
  getDefaultRubberBand,
  getMainAxisTouchCoordinate,
  getNextMainAxisOffset,
  resolveSheetSide,
} from '../utils'
import { createSheetDragState, moveSheetDrag } from './sheetDrag'
import type { SheetDragState } from './sheetDrag'
import { useDrag } from './useDrag'
import type { SnappingOptions } from './useSnap'
import type { SheetSide } from '../types'

export { getRubberBandConfig } from './sheetDrag'

export interface SnapTouchOptions {
  side?: SheetSide
  enableRTL?: boolean
  dragDisabled?: boolean
  rubberBand?: boolean | number | { coeff?: number, max?: number }
  flingEnabled?: boolean
  flingDeceleration?: number
  flingMinVelocity?: number
  dismissThreshold?: number
  enableDragToClose?: boolean
  claimedGestureAngles?: [number, number][]
  yRef: MainThreadRef<MotionValue<number>>
  viewportSize: number
  snapOffsets: number[]
  snapPointValues: number[]
  minOffset: number
  maxOffset: number
  sheetSizeMTRef: MainThreadRef<number>
  getResolvedSnapOffsets: () => number[]
  getResolvedSnapPointValues: () => number[]
  // Controller handlers
  onDragStartMT: () => void
  onDragEndSnapMT: (
    index: number,
    opts?: { animationConfig?: SnappingOptions['animationConfig'] },
  ) => void
  onDragEndCloseMT: (
    opts?: { animationConfig?: SnappingOptions['animationConfig'] },
  ) => void
}

export function useSnapTouches({
  side = 'bottom',
  enableRTL = false,
  dragDisabled = false,
  rubberBand,
  flingEnabled = true,
  flingDeceleration = 2000,
  flingMinVelocity = 200,
  dismissThreshold = 0.15,
  enableDragToClose = true,
  yRef,
  viewportSize,
  sheetSizeMTRef,
  getResolvedSnapOffsets,
  claimedGestureAngles,
  // Controller handlers
  onDragStartMT,
  onDragEndSnapMT,
  onDragEndCloseMT,
}: SnapTouchOptions) {
  const resolvedSide = resolveSheetSide(side, enableRTL)
  const effectiveRubberBand = rubberBand ?? getDefaultRubberBand(resolvedSide)
  const lastTouchMainAxisRef = useMainThreadRef<number>(0)
  const dragStateMTRef = useMainThreadRef<SheetDragState | null>(null)
  const isDraggingMTRef = useMainThreadRef<boolean>(false)

  function handleTouchStartMT(e: MainThread.TouchEvent) {
    'main thread'
    if (dragDisabled) return
    const offsets = getResolvedSnapOffsets()
    if (offsets.length === 0) return

    // Only record start position - don't stop animation or change state yet
    // Wait for handleFirstMoveMT to confirm this is a sheet drag
    dragStateMTRef.current = null
    lastTouchMainAxisRef.current = getMainAxisTouchCoordinate(
      resolvedSide,
      e.detail,
    )
  }

  function handleFirstMoveMT() {
    'main thread'
    if (dragDisabled) return
    const offsets = getResolvedSnapOffsets()
    if (offsets.length === 0) return

    isDraggingMTRef.current = true

    // Delegate to controller - handles resurrection and stopping animations
    onDragStartMT()
    dragStateMTRef.current = createSheetDragState(
      yRef.current.get(),
      offsets,
      effectiveRubberBand,
      viewportSize,
      enableDragToClose,
    )
  }

  function handleTouchMoveMT(e: MainThread.TouchEvent) {
    'main thread'
    if (dragDisabled) return
    const offsets = getResolvedSnapOffsets()
    if (offsets.length === 0) return
    const coordinate = getMainAxisTouchCoordinate(resolvedSide, e.detail)
    const delta = getNextMainAxisOffset(
      resolvedSide,
      0,
      coordinate - lastTouchMainAxisRef.current,
    )
    lastTouchMainAxisRef.current = coordinate
    let current = yRef.current.get()
    let state = dragStateMTRef.current
    // An imperative snap can replace the position while a finger is still down.
    if (current !== state?.position) {
      if (state) {
        onDragStartMT()
        current = yRef.current.get()
      }
      state = createSheetDragState(
        current,
        offsets,
        effectiveRubberBand,
        viewportSize,
        enableDragToClose,
      )
    }
    if (!state) return
    const next = moveSheetDrag(state, delta)
    dragStateMTRef.current = next
    if (delta !== 0) yRef.current.set(next.position)
  }

  function handleTouchEndMT() {
    'main thread'
    // Only process if we started a real vertical drag
    if (!isDraggingMTRef.current) return
    isDraggingMTRef.current = false
    dragStateMTRef.current = null

    if (dragDisabled) return
    const offsets = getResolvedSnapOffsets()
    if (offsets.length === 0) return
    const current = yRef.current.get()
    const velocity = yRef.current.getVelocity()

    const validOffsets = offsets.filter(o => o !== -1)
    const min = validOffsets.length > 0 ? Math.min(...validOffsets) : 0
    const closed = 0
    const dismissLine = Math.max(min - dismissThreshold * viewportSize, closed)
    const isOpeningFling = flingEnabled && velocity >= flingMinVelocity

    // An opening fling can recover the sheet even inside the dismiss zone.
    if (enableDragToClose && current <= dismissLine && !isOpeningFling) {
      onDragEndCloseMT()
      return
    }

    const { index } = findNearestSnap(
      current,
      offsets,
      Math.max(sheetSizeMTRef.current, Math.max(...validOffsets, 0)),
    )
    if (flingEnabled && Math.abs(velocity) >= flingMinVelocity) {
      const travel = (Math.abs(velocity) * Math.abs(velocity))
        / (2 * flingDeceleration)
      let projected = current + Math.sign(velocity) * travel
      const min2 = 0
      const maxSnap = validOffsets.length > 0 ? Math.max(...validOffsets) : 0
      const max2 = clamp(maxSnap, Math.max(sheetSizeMTRef.current, maxSnap))

      if (projected < min2) projected = min2
      if (projected > max2) projected = max2

      let candidates = offsets
      if (isOpeningFling) {
        candidates = offsets.filter(offset => offset > closed)
      } else if (enableDragToClose) {
        candidates = [...offsets, closed]
      }

      const n = findNearestSnap(
        projected,
        candidates,
        Math.max(sheetSizeMTRef.current, maxSnap),
      )
      if (n.value === closed) {
        onDragEndCloseMT()
      } else {
        const snapIndex = isOpeningFling
          ? offsets.indexOf(candidates[n.index])
          : n.index
        onDragEndSnapMT(snapIndex)
      }
    } else {
      onDragEndSnapMT(index)
    }
  }

  const {
    handleTouchStartMT: handleTouchStartW,
    handleTouchMoveMT: handleTouchMoveW,
    handleTouchEndMT: handleTouchEndW,
  } = useDrag({
    side,
    enableRTL,
    claimedGestureAngles,
    onStartMT: handleTouchStartMT,
    onFirstMoveMT: handleFirstMoveMT,
    onMoveMT: handleTouchMoveMT,
    onEndMT: handleTouchEndMT,
  })

  return {
    handleTouchStartMT: handleTouchStartW,
    handleTouchMoveMT: handleTouchMoveW,
    handleTouchEndMT: handleTouchEndW,
  }
}
