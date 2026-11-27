// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useRef } from '@lynx-js/react'

import { useMemoizedFn } from '@lynx-js/lynx-ui-common'

import { useSheetContext, useSheetPositionerContext } from '../context'
import type {
  SheetContentProps,
  SheetSnapPoint,
  SheetTransition,
} from '../types'
import { getDefaultRubberBand } from '../utils'
import { useSnap } from './useSnap'

function toSnappingOptions(opts?: {
  animate?: boolean
  snapAnimation?: SheetTransition
  isEntry?: boolean
}) {
  if (!opts) return undefined
  return {
    animate: opts.animate,
    animationConfig: opts.snapAnimation,
    isEntry: opts.isEntry,
  }
}

const DEFAULT_SNAP_POINTS: SheetSnapPoint[] = ['fit']
const DEFAULT_TRANSITION: SheetTransition = {
  type: 'spring',
  stiffness: 200,
  damping: 60,
}

export function useSheetContentController(
  props: SheetContentProps,
) {
  const {
    snapAnimation = DEFAULT_TRANSITION,
    enterAnimation,
    exitAnimation,
    frame,
    cornerRadius,
    initialCornerRadius,
    initialFrame,
    style,
  } = props
  const context = useSheetContext()
  const positioner = useSheetPositionerContext()
  const {
    sheetProgress,
    registerMethods,
    snapPoints = DEFAULT_SNAP_POINTS,
    initialSnap = 0,
    side,
    enableRTL,
    resolvedSide,
    rubberBand,
    screenHeight,
    screenWidth,
    onSnapChange,
    onSnapStartMT,
    onDragStartMT,
    onPositionChangeMT,
    onPresenceChangeMT,
    onShowChange,
    presenceStateMTRef,
    openEpochMTRef,
    isCurrentOpenEpoch,
    onUnmount,
    onOpen,
    onClose,
    show: showFromContext,
    autoOpen,
  } = context
  const initialOpen = autoOpen ?? showFromContext
  const effectiveRubberBand = rubberBand ?? getDefaultRubberBand(resolvedSide)
  const pendingInternalShowRef = useRef<boolean | null>(null)

  const handleBeforeDismiss = useMemoizedFn((leavingEpoch?: number) => {
    if (isCurrentOpenEpoch && !isCurrentOpenEpoch(leavingEpoch)) {
      return
    }
    pendingInternalShowRef.current = false
    onShowChange?.(false)
  })
  const handleDismissed = useMemoizedFn(() => onClose?.())
  const handleEntered = useMemoizedFn(() => onOpen?.())
  const handleResurrected = useMemoizedFn(() => {
    pendingInternalShowRef.current = true
    onShowChange?.(true)
  })

  const snap = useSnap({
    snapPoints,
    initialSnap,
    initialOpen,
    frame,
    cornerRadius,
    initialCornerRadius,
    initialFrame,
    surfaceStyle: style,
    snapAnimation,
    side,
    enableRTL,
    screenHeight,
    screenWidth,
    positioner,
    onSnapChange,
    onSnapStartMT,
    onDragStartMT,
    onPositionChangeMT,
    onPresenceChangeMT,
    onDismiss: handleDismissed,
    onBeforeDismiss: handleBeforeDismiss,
    onEntered: handleEntered,
    enterAnimation,
    exitAnimation,
    rubberBand: effectiveRubberBand,
    sheetProgress,
    presenceStateMTRef,
    openEpochMTRef,
    onUnmount,
    onResurrected: handleResurrected,
  })

  // Seed to `showFromContext` so cold prop-driven opens don't double-fire `snap.show()`,
  // and imperative `ref.current.open(opts)` / `snapTo(index, opts)` aren't overwritten by `snap.show()`.
  const prevShowRef = useRef(Boolean(showFromContext))
  const isLepus = typeof __LEPUS__ !== 'undefined' && __LEPUS__
  if (!isLepus) {
    registerMethods({
      snapTo: (index, opts) => snap.snapTo(index, toSnappingOptions(opts)),
      expand: opts => snap.expand(toSnappingOptions(opts)),
      collapse: opts => snap.collapse(toSnappingOptions(opts)),
      close: opts => snap.close(toSnappingOptions(opts)),
      show: opts => snap.show(toSnappingOptions(opts)),
    })
  }
  useEffect(() => () => registerMethods(null), [registerMethods])

  useEffect(() => {
    const pendingInternal = pendingInternalShowRef.current
    pendingInternalShowRef.current = null
    if (prevShowRef.current === showFromContext) return
    prevShowRef.current = showFromContext
    if (pendingInternal === showFromContext) {
      return
    }
    if (showFromContext) {
      snap.show()
    } else {
      snap.close()
    }
  }, [showFromContext, snap.show, snap.close])

  useEffect(() => {
    pendingInternalShowRef.current = null
  })

  return {
    context,
    positioner,
    effectiveRubberBand,
    snap,
    snapPoints,
  }
}
