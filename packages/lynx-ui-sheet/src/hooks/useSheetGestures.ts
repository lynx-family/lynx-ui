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
} from '../utils'
import {
  parseScrollInfoAtStart,
  reconcileSheetGestureRelations,
  setupSheetScrollGestureRelations,
} from './gestureRelations'
import { resolveNestedScrollOwner } from './nestedScroll'
import { createSheetDragState, moveSheetDrag } from './sheetDrag'
import type { SheetDragState } from './sheetDrag'
import { getSheetScrollGesture } from './sheetScrollGesture'
import type { SnappingOptions } from './useSnap'

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
  onGestureStartMT?: () => void
  onGestureEndMT?: () => void
  onDragStartMT: () => void
  onDragEndSnapMT: (
    index: number,
    opts?: { animationConfig?: SnappingOptions['animationConfig'] },
  ) => void
  onDragEndCloseMT: (
    opts?: { animationConfig?: SnappingOptions['animationConfig'] },
  ) => void
  onReleaseAtMaxMT?: (index: number) => void
}

interface UseSheetNativeScrollGestureOptions {
  sheetGesture: GestureKind
  contentDragEnabled?: boolean
  minDistance?: number
  activeScrollMTRef: MainThreadRef<ActiveSheetScrollGesture | null>
  resolvedSide: 'top' | 'bottom' | 'left' | 'right'
  position: MainThreadRef<MotionValue<number>>
  sheetDraggingMTRef: MainThreadRef<boolean>
  getResolvedSnapOffsets: () => number[]
  onScrollEndMT?: (cancelled: boolean) => void
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
  onGestureStartMT,
  onGestureEndMT,
  onDragStartMT,
  onDragEndSnapMT,
  onDragEndCloseMT,
  onReleaseAtMaxMT,
}: UseSheetPanGestureOptions) {
  const pan = useGesture(PanGesture)
  const resolvedSide = resolveSheetSide(side, enableRTL)
  const effectiveRubberBand = rubberBand ?? getDefaultRubberBand(resolvedSide)
  const lastCoordinateMTRef = useMainThreadRef(0)
  const draggingMTRef = useMainThreadRef(false)
  const dragStateMTRef = useMainThreadRef<SheetDragState | null>(null)
  const handedOffAtMaxMTRef = useMainThreadRef(false)
  const interactionStartedMTRef = useMainThreadRef(false)
  const originMTRef = useMainThreadRef({ pageX: 0, pageY: 0 })
  const dragEnabled = !dragDisabled && (gestureConfig?.enabled ?? true)

  function finishTouchMT(cancelled = false) {
    'main thread'
    const started = interactionStartedMTRef.current
    interactionStartedMTRef.current = false
    // Recognizer completion is not physical release. Native touch-up can call
    // this too, after a related recognizer has failed or handed off the drag.
    if (started && !activeScrollMTRef.current) onGestureEndMT?.()
    const wasDragging = draggingMTRef.current
    draggingMTRef.current = false
    dragStateMTRef.current = null
    const handedOffAtMax = handedOffAtMaxMTRef.current
    handedOffAtMaxMTRef.current = false
    if (!wasDragging) {
      if (handedOffAtMax) {
        const offsets = getResolvedSnapOffsets()
        const maximumPosition = resolveMaximumPosition(offsets)
        const index = offsets.indexOf(maximumPosition)
        if (index >= 0) onReleaseAtMaxMT?.(index)
      }
      return
    }
    const offsets = getResolvedSnapOffsets()
    const valid = offsets.filter(offset => offset !== -1)
    if (valid.length === 0) return
    const current = yRef.current.get()
    if (cancelled) yRef.current.updateVelocity(0)
    const velocity = cancelled ? 0 : yRef.current.getVelocity()
    const min = Math.min(...valid)
    const dismissLine = Math.max(min - dismissThreshold * viewportSize, 0)
    const isOpeningFling = flingEnabled && velocity >= flingMinVelocity
    // Match raw-touch recovery when an opening fling starts in the dismiss zone.
    if (
      !cancelled && enableDragToClose && current <= dismissLine
      && !isOpeningFling
    ) {
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
    const preferOpenSnap = (isOpeningFling || cancelled)
      && valid.some(offset => offset > 0)
    const candidates = preferOpenSnap
      ? offsets.filter(offset => offset > 0)
      : offsets
    const nearest = findNearestSnap(
      target,
      candidates,
      Math.max(sheetSizeMTRef.current, ...valid),
    )
    onDragEndSnapMT(
      preferOpenSnap
        ? offsets.indexOf(candidates[nearest.index])
        : nearest.index,
    )
  }

  pan
    .enabled(dragEnabled)
    .minDistance(gestureConfig?.minDistance ?? 3)
    .onTouchesDown(() => {
      'main thread'
      dragStateMTRef.current = null
    })
    .onBegin(event => {
      'main thread'
      originMTRef.current = {
        pageX: event.params.pageX,
        pageY: event.params.pageY,
      }
      lastCoordinateMTRef.current = getMainAxisGestureCoordinate(
        resolvedSide,
        event.params,
      )
      draggingMTRef.current = false
      dragStateMTRef.current = null
      handedOffAtMaxMTRef.current = false
      interactionStartedMTRef.current = false
    })
    .onUpdate((event: PanGestureChangeEvent, manager: StateManager) => {
      'main thread'
      if (!dragEnabled) {
        draggingMTRef.current = false
        manager.fail()
        return
      }
      const horizontal = resolvedSide === 'left' || resolvedSide === 'right'
      const dx = Math.abs(event.params.pageX - originMTRef.current.pageX)
      const dy = Math.abs(event.params.pageY - originMTRef.current.pageY)
      if (
        !interactionStartedMTRef.current && (horizontal ? dy > dx : dx > dy)
      ) {
        manager.fail()
        return
      }
      const coordinate = getMainAxisGestureCoordinate(
        resolvedSide,
        event.params,
      )
      const rawDelta = coordinate - lastCoordinateMTRef.current
      lastCoordinateMTRef.current = coordinate
      const current = yRef.current.get()
      const delta = getNextMainAxisOffset(resolvedSide, 0, rawDelta)
      const offsets = getResolvedSnapOffsets()
      const scroll = activeScrollMTRef.current
      // Gesture runtimes may emit stationary updates while a related native
      // gesture is still resolving. A zero delta carries no ownership intent.
      if (delta === 0) return
      const maximumPosition = scroll
        ? resolveMaximumPosition(offsets)
        : undefined
      const owner = scroll && maximumPosition !== undefined
        ? resolveNestedScrollOwner({
          delta,
          position: current,
          maximumPosition,
          sheetDragging: draggingMTRef.current,
          contentAtStart: scroll.atStart,
          contentAtEnd: scroll.atEnd,
        })
        : 'sheet'
      if (!interactionStartedMTRef.current) {
        interactionStartedMTRef.current = true
        // Let a released stretch settle while the new touch scrolls content.
        if (
          owner === 'sheet' || maximumPosition === undefined
          || current <= maximumPosition
        ) {
          onGestureStartMT?.()
        }
      }
      let handoffMaximum = maximumPosition
      if (scroll && maximumPosition !== undefined) {
        if (owner === 'content') {
          // Both recognizers stay active so reversals retain live boundaries.
          if (draggingMTRef.current && current === maximumPosition) {
            handedOffAtMaxMTRef.current = true
          }
          draggingMTRef.current = false
          dragStateMTRef.current = null
          if (scroll.consuming !== true) {
            scroll.manager?.consumeGesture(true)
            scroll.consuming = true
            activeScrollMTRef.current = scroll
          }
          return
        }
        // Keep resistance for short content or while unwinding an existing stretch.
        if (
          (scroll.atStart === true && scroll.atEnd === true)
          || current > maximumPosition
        ) {
          handoffMaximum = undefined
        }
        if (scroll.consuming !== false) {
          scroll.manager?.consumeGesture(false)
          scroll.consuming = false
          activeScrollMTRef.current = scroll
        }
      }

      if (!draggingMTRef.current) {
        draggingMTRef.current = true
        handedOffAtMaxMTRef.current = false
        onDragStartMT()
      }
      let dragPosition = yRef.current.get()
      let state = dragStateMTRef.current
      // Rebase after an external position change, but never feed resistance
      // or native-owned displacement back into the next raw Sheet movement.
      if (dragPosition !== state?.position) {
        if (state) {
          onDragStartMT()
          dragPosition = yRef.current.get()
        }
        state = createSheetDragState(
          dragPosition,
          offsets,
          effectiveRubberBand,
          viewportSize,
          enableDragToClose,
        )
      }
      if (!state) return
      const next = moveSheetDrag(state, delta, handoffMaximum)
      dragStateMTRef.current = next
      yRef.current.set(next.position)
    })
    .onTouchesUp(() => {
      'main thread'
      finishTouchMT()
    })
    .onTouchesCancel(() => {
      'main thread'
      finishTouchMT(true)
    })

  reconcileSheetGestureRelations(pan, gestureRelations)
  return { gesture: pan, finishTouchMT, sheetDraggingMTRef: draggingMTRef }
}

type NativeScrollParams = NativeGestureChangeEvent['params'] & {
  isAtStart?: boolean | number
  isAtEnd?: boolean | number
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
  if (params.isAtStart !== undefined) {
    return params.isAtStart === true || params.isAtStart === 1
  }
  return scrollOffset === undefined ? undefined : scrollOffset <= 0
}

/** Create the NativeGesture shared by SheetNestedScrollContent descendants. */
export function useSheetNativeScrollGesture({
  sheetGesture,
  contentDragEnabled = true,
  minDistance = 3,
  activeScrollMTRef,
  resolvedSide,
  position,
  sheetDraggingMTRef,
  getResolvedSnapOffsets,
  onScrollEndMT,
}: UseSheetNativeScrollGestureOptions): NativeGesture {
  const nativeGesture = useGesture(NativeGesture)
  const lastCoordinateMTRef = useMainThreadRef(0)
  const scrollOriginMTRef = useMainThreadRef({ pageX: 0, pageY: 0 })
  const mainAxisStartedMTRef = useMainThreadRef(false)
  const scrollStateMTRef = useMainThreadRef<ActiveSheetScrollGesture | null>(
    null,
  )

  nativeGesture
    .enabled(true)
    .onBegin((_, manager) => {
      'main thread'
      const state = scrollStateMTRef.current
      if (state?.consuming !== true) {
        manager.consumeGesture(true)
        if (state) {
          state.consuming = true
          scrollStateMTRef.current = state
          activeScrollMTRef.current = state
        }
      }
    })
    .onTouchesDown((event, manager) => {
      'main thread'
      const params = event.params as NativeScrollParams
      scrollOriginMTRef.current = { pageX: params.pageX, pageY: params.pageY }
      mainAxisStartedMTRef.current = false
      lastCoordinateMTRef.current = getMainAxisGestureCoordinate(
        resolvedSide,
        params,
      )
      // Prefer native boundary fields to asynchronous scroll-position queries.
      const boundaryFromParams = getDefaultScrollStartBoundary(
        resolvedSide,
        params,
      )
      const capturedState: ActiveSheetScrollGesture = {
        manager,
        atStart: boundaryFromParams,
        atEnd: params.isAtEnd === undefined
          ? undefined
          : params.isAtEnd === true || params.isAtEnd === 1,
        revision: 0,
      }
      scrollStateMTRef.current = capturedState
      activeScrollMTRef.current = capturedState
      // A cold query is only needed when the native event has no boundary.
      // Never let it overwrite a newer observation or another touch/target.
      if (boundaryFromParams !== undefined) return
      void (event.currentTarget as {
        invoke: (m: string) => Promise<{ scrollX?: number, scrollY?: number }>
      })
        .invoke('getScrollInfo')
        .then((info) => {
          'main thread'
          const atStart = parseScrollInfoAtStart(resolvedSide, info)
          if (atStart === undefined) return
          if (
            scrollStateMTRef.current === capturedState
            && activeScrollMTRef.current === capturedState
            && capturedState.revision === 0
          ) {
            capturedState.atStart = atStart
            scrollStateMTRef.current = capturedState
            activeScrollMTRef.current = capturedState
          }
        })
        .catch(() => {
          'main thread'
        })
    })
    .onUpdate((event, manager) => {
      'main thread'
      const params = event.params as NativeScrollParams
      const state = scrollStateMTRef.current
      if (!state) return
      // Only overwrite atStart when gesture params explicitly supply a value.
      // Otherwise retain the boundary sampled by the native integration.
      const boundaryFromParams = getDefaultScrollStartBoundary(
        resolvedSide,
        params,
      )
      if (boundaryFromParams !== undefined || params.isAtEnd !== undefined) {
        if (boundaryFromParams !== undefined) {
          // A changed partial observation invalidates the other old boundary;
          // combining the top and bottom from different frames looks like an
          // empty target even when the content has scrolled between them.
          if (
            state.atStart !== boundaryFromParams && params.isAtEnd === undefined
          ) {
            state.atEnd = undefined
          }
          state.atStart = boundaryFromParams
        }
        if (params.isAtEnd !== undefined) {
          const atEnd = params.isAtEnd === true || params.isAtEnd === 1
          if (state.atEnd !== atEnd && boundaryFromParams === undefined) {
            state.atStart = undefined
          }
          state.atEnd = atEnd
        }
        state.revision = (state.revision ?? 0) + 1
        scrollStateMTRef.current = state
        activeScrollMTRef.current = state
      }
      const horizontal = resolvedSide === 'left' || resolvedSide === 'right'
      const dx = Math.abs(params.pageX - scrollOriginMTRef.current.pageX)
      const dy = Math.abs(params.pageY - scrollOriginMTRef.current.pageY)
      // NativeGesture emits updates before the related PanGesture activates.
      // Keep boundary observations alive through the same recognition distance.
      if (
        contentDragEnabled && !mainAxisStartedMTRef.current
        && dx <= minDistance && dy <= minDistance
      ) {
        return
      }
      if (
        !contentDragEnabled
        || (!mainAxisStartedMTRef.current && (horizontal ? dy > dx : dx > dy))
      ) {
        if (state.consuming !== true) {
          manager.consumeGesture(true)
          state.consuming = true
          scrollStateMTRef.current = state
          activeScrollMTRef.current = state
        }
        if (contentDragEnabled) manager.fail()
        return
      }
      const coordinate = getMainAxisGestureCoordinate(resolvedSide, params)
      const rawDelta = coordinate - lastCoordinateMTRef.current
      lastCoordinateMTRef.current = coordinate
      // Keep the recognized axis across reversals, including through the origin.
      // Reclassifying there mistakes small sideways drift for a new child pan.
      if (rawDelta !== 0) mainAxisStartedMTRef.current = true
      const sheetDelta = getNextMainAxisOffset(resolvedSide, 0, rawDelta)
      if (sheetDelta === 0) return
      const offsets = getResolvedSnapOffsets()
      const maximumPosition = resolveMaximumPosition(offsets)
      const owner = resolveNestedScrollOwner({
        delta: sheetDelta,
        position: position.current.get(),
        maximumPosition,
        sheetDragging: sheetDraggingMTRef.current,
        contentAtStart: state.atStart,
        contentAtEnd: state.atEnd,
      })
      if (owner === 'sheet' && state.consuming !== false) {
        manager.consumeGesture(false)
        state.consuming = false
        scrollStateMTRef.current = state
        activeScrollMTRef.current = state
      }
    })
    .onTouchesUp(() => {
      'main thread'
      if (activeScrollMTRef.current === scrollStateMTRef.current) {
        activeScrollMTRef.current = null
      }
      scrollStateMTRef.current = null
      onScrollEndMT?.(false)
    })
    .onTouchesCancel(() => {
      'main thread'
      if (activeScrollMTRef.current === scrollStateMTRef.current) {
        activeScrollMTRef.current = null
      }
      scrollStateMTRef.current = null
      onScrollEndMT?.(true)
    })

  setupSheetScrollGestureRelations(
    nativeGesture,
    contentDragEnabled ? sheetGesture : undefined,
  )
  return nativeGesture
}

/** Return the scroll gesture owned by the nearest SheetNestedScrollContent. */
export function useSheetScrollGesture(): NativeGesture {
  return getSheetScrollGesture(useSheetGestureContext())
}
