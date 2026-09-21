// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useSnapTouches } from '../hooks'
import { useSheetContentController } from '../hooks/useSheetContentController'
import { SheetSurface } from '../SheetSurface'
import type { SheetContentProps } from '../types'

/**
 * The touch-event based Sheet surface.
 * Use SheetGestureContent when the Sheet contains a native scroll container.
 */
export function SheetContent(props: SheetContentProps) {
  const { context, effectiveRubberBand, snap, snapPoints } =
    useSheetContentController(props)
  const {
    side,
    enableRTL,
    dragDisabled = false,
    dismissThreshold = 0.15,
    enableDragToClose = true,
    claimedGestureAngles,
  } = context

  const dragHandlers = useSnapTouches({
    side,
    enableRTL,
    dragDisabled,
    rubberBand: effectiveRubberBand,
    flingEnabled: true,
    flingDeceleration: 2000,
    flingMinVelocity: 200,
    dismissThreshold,
    enableDragToClose,
    yRef: snap.yRef,
    viewportSize: snap.viewportSize,
    snapOffsets: snap.snapOffsets,
    snapPointValues: snap.snapPointValues,
    minOffset: snap.minOffset,
    maxOffset: snap.maxOffset,
    sheetSizeMTRef: snap.sheetSizeMTRef,
    getResolvedSnapOffsets: snap.getResolvedSnapOffsets,
    getResolvedSnapPointValues: snap.getResolvedSnapPointValues,
    claimedGestureAngles,
    onDragStartMT: snap.onDragStartMT,
    onDragEndSnapMT: snap.onDragEndSnapMT,
    onDragEndCloseMT: snap.onDragEndCloseMT,
  })

  return (
    <SheetSurface
      {...props}
      dragHandlers={dragHandlers}
      resolvedSide={context.resolvedSide}
      handleOnly={context.handleOnly}
      snapPoints={snapPoints}
      maxSnapSize={snap.maxSnapSize}
      setSheetMTRef={snap.setSheetMTRef}
      setContentMTRef={snap.setContentMTRef}
      handleSheetLayoutChangeMT={snap.handleSheetLayoutChangeMT}
    />
  )
}
