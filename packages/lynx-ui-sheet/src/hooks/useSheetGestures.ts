// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMainThreadRef } from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import { NativeGesture, PanGesture, useGesture } from '@lynx-js/gesture-runtime'
import type {
  GestureKind,
  NativeGestureChangeEvent,
  PanGestureChangeEvent,
  StateManager,
} from '@lynx-js/gesture-runtime'
import type { MotionValue } from '@lynx-js/motion/mini'

import type { ActiveSheetScrollGesture } from '../context'
import { useSheetGestureContext } from '../context'
import type {
  SheetGestureConfig,
  SheetGestureRelations,
  SheetSide,
  UseSheetScrollGestureOptions,
} from '../types'
import {
  clamp,
  findNearestSnap,
  getDefaultRubberBand,
  getMainAxisTouchCoordinate,
  getNextMainAxisOffset,
  resolveSheetSide,
  rubberEffect,
} from '../utils'
import { resolveNestedScrollOwner } from './nestedScroll'
import type { SnappingOptions } from './useSnap'
import { getRubberBandConfig } from './useSnapTouches'

interface UseSheetPanGestureOptions {
  side?: SheetSide
  enableRTL?: boolean
  dragDisabled?: boolean
  rubberBand?: boolean | number | { coeff?: number, max?: number }
  enableDragToClose?: boolean
  dismissThreshold?: number
  flingEnabled?: boolean
  flingDeceleration?: number
  flingMinVelocity?: number
  gestureConfig?: SheetGestureConfig
  gestureRelations?: SheetGestureRelations
  activeScrollMTRef: MainThreadRef<ActiveSheetScrollGesture | null>
  yRef: MainThreadRef<MotionValue<number>>
  viewportSize: number
  sheetSizeMTRef: MainThreadRef<number>
  getResolvedSnapOffsets: () => number[]
  onDragStartMT: () => void
  onDragEndSnapMT: (
    index: number,
    opts?: { animationConfig?: SnappingOptions['animationConfig'] },
  ) => void
  onDragEndCloseMT: (
    opts?: { animationConfig?: SnappingOptions['animationConfig'] },
  ) => void
}

function resolveHandoffPosition(
  handoffAt: 'max' | number,
  offsets: number[],
) {
  'main thread'
  const valid = offsets.filter(offset => offset !== -1)
  if (valid.length === 0) return 0
  if (handoffAt === 'max') return Math.max(...valid)
  const index = Math.max(0, Math.min(handoffAt, offsets.length - 1))
  return offsets[index] === -1 ? Math.max(...valid) : offsets[index]
}

export function useSheetPanGesture({
  side = 'bottom',
  enableRTL = false,
  dragDisabled = false,
  rubberBand,
  enableDragToClose = true,
  dismissThreshold = 0.15,
  flingEnabled = true,
  flingDeceleration = 2000,
  flingMinVelocity = 200,
  gestureConfig,
  gestureRelations,
  activeScrollMTRef,
  yRef,
  viewportSize,
  sheetSizeMTRef,
  getResolvedSnapOffsets,
  onDragStartMT,
  onDragEndSnapMT,
  onDragEndCloseMT,
}: UseSheetPanGestureOptions): PanGesture {
  const pan = useGesture(PanGesture)
  const resolvedSide = resolveSheetSide(side, enableRTL)
  const effectiveRubberBand = rubberBand ?? getDefaultRubberBand(resolvedSide)
  const lastCoordinateMTRef = useMainThreadRef(0)
  const draggingMTRef = useMainThreadRef(false)
  const yieldedToContentMTRef = useMainThreadRef(false)

  pan
    .enabled(!dragDisabled && (gestureConfig?.enabled ?? true))
    .minDistance(gestureConfig?.minDistance ?? 3)
    .updateConfig('activeOffsetX', gestureConfig?.activeOffsetX)
    .updateConfig('activeOffsetY', gestureConfig?.activeOffsetY)
    .updateConfig('failOffsetX', gestureConfig?.failOffsetX)
    .updateConfig('failOffsetY', gestureConfig?.failOffsetY)
    .onBegin(event => {
      'main thread'
      lastCoordinateMTRef.current = getMainAxisTouchCoordinate(
        resolvedSide,
        event.params,
      )
      draggingMTRef.current = false
      yieldedToContentMTRef.current = false
    })
    .onUpdate((event: PanGestureChangeEvent, manager: StateManager) => {
      'main thread'
      if (yieldedToContentMTRef.current) return
      const coordinate = getMainAxisTouchCoordinate(resolvedSide, event.params)
      const rawDelta = coordinate - lastCoordinateMTRef.current
      lastCoordinateMTRef.current = coordinate
      const current = yRef.current.get()
      const next = getNextMainAxisOffset(resolvedSide, current, rawDelta)
      const delta = next - current
      const offsets = getResolvedSnapOffsets()
      const scroll = activeScrollMTRef.current
      // Gesture runtimes may emit stationary updates while a related native
      // gesture is still resolving. A zero delta carries no ownership intent;
      // treating it as content ownership would fail the sheet pan before the
      // actual drag reaches its handoff point.
      if (delta === 0) return
      let handoffPosition: number | undefined
      if (scroll) {
        handoffPosition = resolveHandoffPosition(scroll.handoffAt, offsets)
        const owner = resolveNestedScrollOwner({
          behavior: scroll.behavior,
          delta,
          position: current,
          handoffPosition,
          contentAtStart: scroll.atStart,
          contentAtEnd: scroll.atEnd,
        })
        if (owner === 'content') {
          // The pan can have moved the sheet before reaching the handoff point.
          // Once the native scroller takes over, its eventual end must not snap
          // the sheet again using the pan's stale velocity.
          draggingMTRef.current = false
          yieldedToContentMTRef.current = true
          scroll.manager?.consumeGesture(true)
          manager.fail()
          return
        }
        scroll.manager?.consumeGesture(false)
      }

      if (!draggingMTRef.current) {
        draggingMTRef.current = true
        onDragStartMT()
      }
      const valid = offsets.filter(offset => offset !== -1)
      const max = valid.length > 0 ? Math.max(...valid) : 0
      const min = valid.length > 0 ? Math.min(...valid) : 0
      let boundedNext = handoffPosition !== undefined && delta > 0
        ? Math.min(next, handoffPosition)
        : next
      const rubber = getRubberBandConfig(
        effectiveRubberBand,
        viewportSize,
        max,
      )
      if (boundedNext > max) {
        boundedNext = rubber.enabled
          ? max + rubberEffect(boundedNext - max, rubber.max, rubber.coeff)
          : max
      }
      if (boundedNext < min && !enableDragToClose) {
        boundedNext = rubber.enabled
          ? min + rubberEffect(boundedNext - min, rubber.max, rubber.coeff)
          : min
      }
      yRef.current.set(boundedNext)
    })
    .onEnd(() => {
      'main thread'
      if (yieldedToContentMTRef.current) {
        yieldedToContentMTRef.current = false
        return
      }
      if (!draggingMTRef.current) return
      draggingMTRef.current = false
      const offsets = getResolvedSnapOffsets()
      const valid = offsets.filter(offset => offset !== -1)
      if (valid.length === 0) return
      const current = yRef.current.get()
      const velocity = yRef.current.getVelocity()
      const min = Math.min(...valid)
      const dismissLine = Math.max(min - dismissThreshold * viewportSize, 0)
      if (enableDragToClose && current <= dismissLine) {
        onDragEndCloseMT()
        return
      }
      let target = current
      if (flingEnabled && Math.abs(velocity) >= flingMinVelocity) {
        const travel = velocity * Math.abs(velocity) / (2 * flingDeceleration)
        target = clamp(
          current + travel,
          Math.max(sheetSizeMTRef.current, ...valid),
        )
      }
      const nearest = findNearestSnap(
        target,
        offsets,
        Math.max(sheetSizeMTRef.current, ...valid),
      )
      onDragEndSnapMT(nearest.index)
    })

  for (const gesture of gestureRelations?.simultaneousWith ?? []) {
    if (!(pan.simultaneousWith as GestureKind[]).includes(gesture)) {
      pan.externalSimultaneous(gesture)
    }
  }
  for (const gesture of gestureRelations?.waitFor ?? []) {
    if (!(pan.waitFor as GestureKind[]).includes(gesture)) {
      pan.externalWaitFor(gesture)
    }
  }
  for (const gesture of gestureRelations?.continueWith ?? []) {
    if (!(pan.continueWith as GestureKind[]).includes(gesture)) {
      pan.externalContinueWith(gesture)
    }
  }
  return pan
}

type NativeScrollParams = NativeGestureChangeEvent['params'] & {
  isAtStart?: boolean
  isAtEnd?: boolean
  scrollX?: number
  scrollY?: number
}

/** Bind the returned NativeGesture to a scroll-view, list, or fold-view. */
export function useSheetScrollGesture(
  options: UseSheetScrollGestureOptions = {},
): NativeGesture {
  const {
    behavior = 'sheet-first',
    handoffAt = 'max',
    enabled = true,
  } = options
  const {
    sheetGesture,
    activeScrollMTRef,
    resolvedSide,
    position,
    getResolvedSnapOffsets,
  } = useSheetGestureContext()
  const nativeGesture = useGesture(NativeGesture)
  const lastCoordinateMTRef = useMainThreadRef(0)
  const scrollStateMTRef = useMainThreadRef<ActiveSheetScrollGesture | null>(
    null,
  )

  nativeGesture
    .enabled(enabled)
    .onBegin((_, manager) => {
      'main thread'
      // Start with the native recognizer consuming its stream. The sheet pan
      // resolves direction and ownership on its first non-stationary update,
      // then pauses the native recognizer when the sheet owns the drag.
      manager.consumeGesture(true)
    })
    .onTouchesDown((event, manager) => {
      'main thread'
      const params = event.params as NativeScrollParams
      const scrollOffset = resolvedSide === 'left' || resolvedSide === 'right'
        ? params.scrollX
        : params.scrollY
      lastCoordinateMTRef.current = getMainAxisTouchCoordinate(
        resolvedSide,
        params,
      )
      scrollStateMTRef.current = {
        manager,
        behavior,
        handoffAt,
        atStart: params.isAtStart ?? (scrollOffset ?? 0) <= 0,
        atEnd: params.isAtEnd ?? false,
      }
      if (activeScrollMTRef) {
        activeScrollMTRef.current = scrollStateMTRef.current
      }
    })
    .onUpdate((event, manager) => {
      'main thread'
      const params = event.params as NativeScrollParams
      const state = scrollStateMTRef.current
      if (!state) return
      const scrollOffset = resolvedSide === 'left' || resolvedSide === 'right'
        ? params.scrollX
        : params.scrollY
      state.atStart = params.isAtStart ?? (scrollOffset ?? 0) <= 0
      state.atEnd = params.isAtEnd ?? false
      const coordinate = getMainAxisTouchCoordinate(resolvedSide, params)
      const rawDelta = coordinate - lastCoordinateMTRef.current
      lastCoordinateMTRef.current = coordinate
      const sheetDelta = getNextMainAxisOffset(resolvedSide, 0, rawDelta)
      const offsets = getResolvedSnapOffsets?.() ?? []
      const owner = resolveNestedScrollOwner({
        behavior,
        delta: sheetDelta,
        position: position?.current.get() ?? 0,
        handoffPosition: resolveHandoffPosition(handoffAt, offsets),
        contentAtStart: state.atStart,
        contentAtEnd: state.atEnd,
      })
      if (owner === 'sheet') {
        manager.consumeGesture(false)
        manager.fail()
      }
    })
    .onTouchesUp(() => {
      'main thread'
      if (
        activeScrollMTRef
        && activeScrollMTRef.current === scrollStateMTRef.current
      ) {
        activeScrollMTRef.current = null
      }
      scrollStateMTRef.current = null
    })
    .onTouchesCancel(() => {
      'main thread'
      if (
        activeScrollMTRef
        && activeScrollMTRef.current === scrollStateMTRef.current
      ) {
        activeScrollMTRef.current = null
      }
      scrollStateMTRef.current = null
    })

  if (
    sheetGesture
    && !(nativeGesture.waitFor as GestureKind[]).includes(sheetGesture)
  ) {
    nativeGesture.externalWaitFor(sheetGesture)
  }
  return nativeGesture
}
