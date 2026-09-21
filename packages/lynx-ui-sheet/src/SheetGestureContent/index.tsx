// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMainThreadRef } from '@lynx-js/react'

import type { ActiveSheetScrollGesture } from '../context'
import { SheetGestureContext } from '../context'
import { useSheetContentController } from '../hooks/useSheetContentController'
import {
  useSheetNativeScrollGesture,
  useSheetPanGesture,
} from '../hooks/useSheetGestures'
import { SheetSurface } from '../SheetSurface'
import type { SheetGestureContentProps } from '../types'

/**
 * A gesture-runtime backed replacement for SheetContent.
 * It creates one coordinated native scroll gesture and exposes that same
 * gesture through both its render prop and useSheetScrollGesture().
 */
export function SheetGestureContent(props: SheetGestureContentProps) {
  const {
    children,
    gestureConfig,
    gestureRelations,
    ...surfaceProps
  } = props
  const { context, effectiveRubberBand, snap, snapPoints } =
    useSheetContentController(surfaceProps)
  const activeScrollMTRef = useMainThreadRef<ActiveSheetScrollGesture | null>(
    null,
  )
  const sheetGesture = useSheetPanGesture({
    side: context.side,
    enableRTL: context.enableRTL,
    dragDisabled: context.dragDisabled,
    rubberBand: effectiveRubberBand,
    enableDragToClose: context.enableDragToClose,
    dismissThreshold: context.dismissThreshold,
    gestureConfig,
    gestureRelations,
    activeScrollMTRef,
    yRef: snap.yRef,
    viewportSize: snap.viewportSize,
    sheetSizeMTRef: snap.sheetSizeMTRef,
    getResolvedSnapOffsets: snap.getResolvedSnapOffsets,
    onDragStartMT: snap.onDragStartMT,
    onDragEndSnapMT: snap.onDragEndSnapMT,
    onDragEndCloseMT: snap.onDragEndCloseMT,
  })
  const scrollGesture = useSheetNativeScrollGesture({
    sheetGesture,
    activeScrollMTRef,
    resolvedSide: context.resolvedSide,
    position: snap.yRef,
    getResolvedSnapOffsets: snap.getResolvedSnapOffsets,
  })
  const resolvedChildren = typeof children === 'function'
    ? children({ scrollGesture })
    : children

  return (
    <SheetGestureContext.Provider
      value={{
        sheetGesture,
        scrollGesture,
        activeScrollMTRef,
      }}
    >
      <SheetSurface
        {...surfaceProps}
        dragHandlers={{ gesture: sheetGesture }}
        sheetGesture={sheetGesture}
        resolvedSide={context.resolvedSide}
        handleOnly={context.handleOnly}
        snapPoints={snapPoints}
        maxSnapSize={snap.maxSnapSize}
        setSheetMTRef={snap.setSheetMTRef}
        setContentMTRef={snap.setContentMTRef}
        handleSheetLayoutChangeMT={snap.handleSheetLayoutChangeMT}
      >
        {resolvedChildren}
      </SheetSurface>
    </SheetGestureContext.Provider>
  )
}
