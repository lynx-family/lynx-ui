// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useRef } from '@lynx-js/react'

import { useMemoizedFn } from '@lynx-js/lynx-ui-common'

import { useSheetContext } from '../context'
import type { SheetContentProps, SheetTransition } from '../types'
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

const DEFAULT_SNAP_POINTS: Array<number | string> = ['fit']
const DEFAULT_TRANSITION: SheetTransition = {
  type: 'spring',
  stiffness: 200,
  damping: 60,
}

export function useSheetContentController(props: SheetContentProps) {
  const {
    snapAnimation = DEFAULT_TRANSITION,
    enterAnimation,
    exitAnimation,
    detached,
    bottomInset,
  } = props
  const context = useSheetContext()
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
    onShowChange,
    presenceStateMTRef,
    onUnmount,
    onOpen,
    onClose,
    show: showFromContext,
  } = context
  const effectiveRubberBand = rubberBand ?? getDefaultRubberBand(resolvedSide)
  const isInternalChangeRef = useRef(false)

  const handleBeforeDismiss = useMemoizedFn(() => {
    isInternalChangeRef.current = true
    onShowChange?.(false)
  })
  const handleDismissed = useMemoizedFn(() => onClose?.())
  const handleEntered = useMemoizedFn(() => onOpen?.())
  const handleResurrected = useMemoizedFn(() => {
    isInternalChangeRef.current = true
    onShowChange?.(true)
  })

  const snap = useSnap({
    snapPoints,
    initialSnap,
    detached,
    bottomInset,
    snapAnimation,
    side,
    enableRTL,
    screenHeight,
    screenWidth,
    onSnapChange,
    onSnapStartMT,
    onDismiss: handleDismissed,
    onBeforeDismiss: handleBeforeDismiss,
    onEntered: handleEntered,
    enterAnimation,
    exitAnimation,
    rubberBand: effectiveRubberBand,
    sheetProgress,
    presenceStateMTRef,
    onUnmount,
    onResurrected: handleResurrected,
  })

  const prevShowRef = useRef(false)
  useEffect(() => {
    if (prevShowRef.current === showFromContext) return
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false
    } else if (showFromContext) {
      snap.show()
    } else {
      snap.close()
    }
    prevShowRef.current = showFromContext
  }, [showFromContext, snap.show, snap.close])

  useEffect(() => {
    registerMethods({
      snapTo: (index, opts) => snap.snapTo(index, toSnappingOptions(opts)),
      expand: opts => snap.expand(toSnappingOptions(opts)),
      collapse: opts => snap.collapse(toSnappingOptions(opts)),
      close: opts => snap.close(toSnappingOptions(opts)),
      show: opts => snap.show(toSnappingOptions(opts)),
    })
    return () => registerMethods(null)
  }, [
    registerMethods,
    snap.snapTo,
    snap.expand,
    snap.collapse,
    snap.close,
    snap.show,
  ])

  return {
    context,
    effectiveRubberBand,
    snap,
    snapPoints,
  }
}
