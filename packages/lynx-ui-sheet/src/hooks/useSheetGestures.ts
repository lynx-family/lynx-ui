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
} from '../types'
import {
  clamp,
  findNearestSnap,
  getDefaultRubberBand,
  getNextMainAxisOffset,
  resolveSheetSide,
  rubberEffect,
} from '../utils'
import { resolveNestedScrollOwner } from './nestedScroll'
import { getSheetScrollGesture } from './sheetScrollGesture'
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

interface UseSheetNativeScrollGestureOptions {
  sheetGesture: GestureKind
  activeScrollMTRef: MainThreadRef<ActiveSheetScrollGesture | null>
  resolvedSide: 'top' | 'bottom' | 'left' | 'right'
  position: MainThreadRef<MotionValue<number>>
  getResolvedSnapOffsets: () => number[]
}

function getMainAxisGestureCoordinate(
  side: 'top' | 'bottom' | 'left' | 'right',
  params: { pageX: number, pageY: number },
) {
  'main thread'
  return side === 'left' || side === 'right' ? params.pageX : params.pageY
}

function resolveMaximumPosition(offsets: number[]) {
  'main thread'
  const valid = offsets.filter(offset => offset !== -1)
  return valid.length > 0 ? Math.max(...valid) : 0
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
      lastCoordinateMTRef.current = getMainAxisGestureCoordinate(
        resolvedSide,
        event.params,
      )
      draggingMTRef.current = false
      yieldedToContentMTRef.current = false
    })
    .onUpdate((event: PanGestureChangeEvent, manager: StateManager) => {
      'main thread'
      if (yieldedToContentMTRef.current) return
      const coordinate = getMainAxisGestureCoordinate(
        resolvedSide,
        event.params,
      )
      const rawDelta = coordinate - lastCoordinateMTRef.current
      lastCoordinateMTRef.current = coordinate
      const current = yRef.current.get()
      const next = getNextMainAxisOffset(resolvedSide, current, rawDelta)
      const delta = next - current
      const offsets = getResolvedSnapOffsets()
      const scroll = activeScrollMTRef.current
      // Gesture runtimes may emit stationary updates while a related native
      // gesture is still resolving. A zero delta carries no ownership intent.
      if (delta === 0) return
      let maximumPosition: number | undefined
      if (scroll) {
        maximumPosition = resolveMaximumPosition(offsets)
        const owner = resolveNestedScrollOwner({
          delta,
          position: current,
          maximumPosition,
          contentAtStart: scroll.atStart,
        })
        if (owner === 'content') {
          // Once content takes over, do not snap the Sheet from stale velocity.
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
      let boundedNext = maximumPosition !== undefined && delta > 0
        ? Math.min(next, maximumPosition)
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
  scrollX?: number
  scrollY?: number
}

function getDefaultScrollStartBoundary(
  resolvedSide: 'top' | 'bottom' | 'left' | 'right',
  params: NativeScrollParams,
): boolean | undefined {
  'main thread'
  const scrollOffset = resolvedSide === 'left' || resolvedSide === 'right'
    ? params.scrollX
    : params.scrollY
  return params.isAtStart ?? (scrollOffset === undefined
    ? undefined
    : scrollOffset <= 0)
}

/** Create the NativeGesture shared by SheetGestureContent descendants. */
export function useSheetNativeScrollGesture({
  sheetGesture,
  activeScrollMTRef,
  resolvedSide,
  position,
  getResolvedSnapOffsets,
}: UseSheetNativeScrollGestureOptions): NativeGesture {
  const nativeGesture = useGesture(NativeGesture)
  const lastCoordinateMTRef = useMainThreadRef(0)
  const scrollStateMTRef = useMainThreadRef<ActiveSheetScrollGesture | null>(
    null,
  )

  nativeGesture
    .enabled(true)
    .onBegin((_, manager) => {
      'main thread'
      manager.consumeGesture(true)
    })
    .onTouchesDown((event, manager) => {
      'main thread'
      const params = event.params as NativeScrollParams
      lastCoordinateMTRef.current = getMainAxisGestureCoordinate(
        resolvedSide,
        params,
      )
      scrollStateMTRef.current = {
        manager,
        atStart: getDefaultScrollStartBoundary(resolvedSide, params),
      }
      activeScrollMTRef.current = scrollStateMTRef.current
    })
    .onUpdate((event, manager) => {
      'main thread'
      const params = event.params as NativeScrollParams
      const state = scrollStateMTRef.current
      if (!state) return
      state.atStart = getDefaultScrollStartBoundary(resolvedSide, params)
      const coordinate = getMainAxisGestureCoordinate(resolvedSide, params)
      const rawDelta = coordinate - lastCoordinateMTRef.current
      lastCoordinateMTRef.current = coordinate
      const sheetDelta = getNextMainAxisOffset(resolvedSide, 0, rawDelta)
      const offsets = getResolvedSnapOffsets()
      const maximumPosition = resolveMaximumPosition(offsets)
      const owner = resolveNestedScrollOwner({
        delta: sheetDelta,
        position: position.current.get(),
        maximumPosition,
        contentAtStart: state.atStart,
      })
      if (owner === 'sheet') {
        manager.consumeGesture(false)
        manager.fail()
      }
    })
    .onTouchesUp(() => {
      'main thread'
      if (activeScrollMTRef.current === scrollStateMTRef.current) {
        activeScrollMTRef.current = null
      }
      scrollStateMTRef.current = null
    })
    .onTouchesCancel(() => {
      'main thread'
      if (activeScrollMTRef.current === scrollStateMTRef.current) {
        activeScrollMTRef.current = null
      }
      scrollStateMTRef.current = null
    })

  if (!(nativeGesture.waitFor as GestureKind[]).includes(sheetGesture)) {
    nativeGesture.externalWaitFor(sheetGesture)
  }
  return nativeGesture
}

/** Return the scroll gesture owned by the nearest SheetGestureContent. */
export function useSheetScrollGesture(): NativeGesture {
  return getSheetScrollGesture(useSheetGestureContext())
}
