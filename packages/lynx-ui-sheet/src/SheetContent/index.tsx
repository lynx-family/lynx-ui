// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { useEffect, useMemo, useRef } from '@lynx-js/react'

import { useMemoizedFn } from '@lynx-js/lynx-ui-common'

import { SheetDragContext, useSheetContext } from '../context'
import { useSnap, useSnapTouches } from '../hooks'
import type { SheetContentProps, SheetTransition } from '../types'

const DEFAULT_SNAP_POINTS: Array<number | string> = []
const DEFAULT_TRANSITION: SheetTransition = {
  type: 'spring',
  stiffness: 200,
  damping: 60,
}

export function SheetContent(props: SheetContentProps) {
  const {
    snapAnimation = DEFAULT_TRANSITION,
    children,
    enterAnimation,
    exitAnimation,
    className,
    style,
    contentClassName,
    contentStyle,
    ...rest
  } = props

  const {
    sheetProgress,
    registerMethods,
    snapPoints = DEFAULT_SNAP_POINTS,
    initialSnap = 0,
    rubberBand = true,
    dragDisabled = false,
    dismissThreshold = 0.15,
    handleOnly,
    enableDragToClose = true,
    screenHeight,
    onSnapChange,
    onShowChange,
    claimedGestureAngles,
    presenceStateMTRef,
    onUnmount,
    onOpen,
    onClose,
    show: showFromContext,
  } = useSheetContext()

  // Track if show state changes are internal (from controller) vs external (from prop/context)
  const isInternalChangeRef = useRef(false)

  const handleBeforeDismiss = useMemoizedFn(() => {
    isInternalChangeRef.current = true
    onShowChange?.(false)
  })

  const handleDismissed = useMemoizedFn(() => {
    onClose?.()
  })

  const handleEntered = useMemoizedFn(() => {
    onOpen?.()
  })

  // Handle resurrection - when user drags during close animation
  const handleResurrected = useMemoizedFn(() => {
    isInternalChangeRef.current = true
    onShowChange?.(true)
  })

  // Core snap logic (shared between touch and gesture-handler variants)
  const {
    setSheetMTRef,
    snapTo,
    expand,
    collapse,
    close,
    show: showSheet,
    // internals for touch handling
    yRef,
    screenHeight: resolvedScreenHeight,
    snapOffsets,
    snapPointValues,
    minOffset,
    sheetHeightMTRef,
    maxOffset,
    getResolvedSnapOffsets,
    getResolvedSnapPointValues,
    handleSheetLayoutChangeMT,
    // Controller exports
    onDragStartMT,
    onDragEndSnapMT,
    onDragEndCloseMT,
  } = useSnap({
    snapPoints,
    initialSnap,
    snapAnimation,
    screenHeight,
    onSnapChange,
    onDismiss: handleDismissed,
    onBeforeDismiss: handleBeforeDismiss,
    onEntered: handleEntered,
    enterAnimation,
    exitAnimation,
    sheetProgress,
    presenceStateMTRef,
    onUnmount,
    onResurrected: handleResurrected,
  })

  // Touch-based input handling (can be swapped with gesture-handler variant)
  const { handleTouchStartMT, handleTouchMoveMT, handleTouchEndMT } =
    useSnapTouches({
      dragDisabled,
      rubberBand,
      flingEnabled: true,
      flingDeceleration: 2000,
      flingMinVelocity: 200,
      dismissThreshold,
      enableDragToClose,
      yRef,
      screenHeight: resolvedScreenHeight,
      snapOffsets,
      snapPointValues,
      minOffset,
      maxOffset,
      sheetHeightMTRef,
      getResolvedSnapOffsets,
      getResolvedSnapPointValues,
      claimedGestureAngles,
      // Controller handlers
      onDragStartMT,
      onDragEndSnapMT,
      onDragEndCloseMT,
    })

  // Track previous show state to detect changes
  // Initialize to false to ensure controlled mode mounts trigger showSheet()
  const prevShowRef = useRef(false)

  // React to show changes from context (e.g., controlled mode, backdrop click)
  // Only act on EXTERNAL changes, not internal state updates from controller
  useEffect(() => {
    if (prevShowRef.current !== showFromContext) {
      if (isInternalChangeRef.current) {
        // Internal change from controller - skip, already handled
        isInternalChangeRef.current = false
      } else {
        // External change - trigger show/close
        if (showFromContext) {
          showSheet()
        } else {
          close()
        }
      }
      prevShowRef.current = showFromContext
    }
  }, [showFromContext, showSheet, close])

  // Register methods with SheetRoot on mount, unregister on unmount
  useEffect(() => {
    registerMethods({
      snapTo,
      expand,
      collapse,
      close,
      show: showSheet,
    })
    return () => {
      registerMethods(null)
    }
  }, [registerMethods, snapTo, expand, collapse, close, showSheet])

  const contextValue = useMemo(
    () => ({
      dragHandlers: {
        handleTouchStartMT,
        handleTouchMoveMT,
        handleTouchEndMT,
      },
    }),
    [handleTouchStartMT, handleTouchMoveMT, handleTouchEndMT],
  )

  return (
    <view
      className={className}
      style={{
        top: '100%',
        height: '100vh',
        overflow: 'hidden',
        alignSelf: 'center',
        padding: 0,
        margin: 0,
        border: 'none',
        boxShadow: 'none',
        ...style,
      }}
      main-thread:ref={setSheetMTRef}
      implicit-animation='false'
      event-through={false}
      main-thread:bindtouchstart={handleOnly ? undefined : handleTouchStartMT}
      main-thread:bindtouchmove={handleOnly ? undefined : handleTouchMoveMT}
      main-thread:bindtouchend={handleOnly ? undefined : handleTouchEndMT}
    >
      <view
        {...rest}
        className={contentClassName}
        style={{
          width: '100%',
          ...contentStyle,
        }}
        main-thread:bindlayoutchange={handleSheetLayoutChangeMT}
      >
        <SheetDragContext.Provider value={contextValue}>
          {children}
        </SheetDragContext.Provider>
      </view>
    </view>
  )
}
