// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnMainThread, useEffect } from '@lynx-js/react'

import type { GestureKind } from '@lynx-js/gesture-runtime'
import type { MainThread } from '@lynx-js/types'

import {
  SheetBodyContext,
  SheetDragContext,
  SheetFooterContext,
} from '../context'
import type {
  SheetBodyContextValue,
  SheetDragContextValue,
  SheetFooterContextValue,
  SheetPositionerDimensions,
} from '../context'
import type {
  SheetContentProps,
  SheetCornerRadius,
  SheetInsets,
} from '../types'

export interface SheetSurfaceProps extends SheetContentProps {
  dragHandlers: SheetDragContextValue['dragHandlers']
  sheetGesture?: GestureKind
  resolvedSide: 'top' | 'bottom' | 'left' | 'right'
  handleOnly?: boolean
  snapPoints: Array<number | string>
  maxSnapSize: number
  screenWidth: number
  positioner?: SheetPositionerDimensions | null
  footerContext: SheetFooterContextValue
  bodyContext: SheetBodyContextValue
  measureSurfaceMT: (event: MainThread.LayoutChangeEvent) => void
  setClipMTRef: (element: MainThread.Element) => void
  setSurfaceMTRef: (element: MainThread.Element | null) => void
  setViewportMTRef: (element: MainThread.Element) => void
  setSheetMTRef: (element: MainThread.Element | null) => void
  setContentMTRef: (element: MainThread.Element) => void
  setInsetsMT: (insets: SheetInsets) => void
  setCornerRadiusMT: (radius: SheetCornerRadius | undefined) => void
  handleSheetLayoutChangeMT: (event: {
    detail?: { height?: number, width?: number }
    params?: { height?: number, width?: number }
  }) => void
}

export function SheetSurface(props: SheetSurfaceProps) {
  const {
    children,
    className,
    style,
    innerClassName,
    innerStyle,
    innerViewProps,
    'main-thread:surfaceControllerRef': surfaceControllerRef,
    snapAnimation: _snapAnimation,
    enterAnimation: _enterAnimation,
    exitAnimation: _exitAnimation,
    cornerRadius: _cornerRadius,
    insets,
    dragHandlers,
    sheetGesture,
    resolvedSide,
    handleOnly,
    snapPoints,
    maxSnapSize,
    screenWidth,
    positioner,
    footerContext,
    bodyContext,
    measureSurfaceMT,
    setClipMTRef,
    setSurfaceMTRef,
    setViewportMTRef,
    setSheetMTRef,
    setContentMTRef,
    setInsetsMT,
    setCornerRadiusMT,
    handleSheetLayoutChangeMT,
    ...nativeProps
  } = props
  const isHorizontal = resolvedSide === 'left' || resolvedSide === 'right'
  const isTop = resolvedSide === 'top'
  const hasFitSnapPoint = snapPoints.some(p => String(p).trim() === 'fit')
  const dragOnContent = isHorizontal && !handleOnly
  const dragOnSurface = !isHorizontal && !handleOnly
  const sheetDragContext = {
    dragHandlers: sheetGesture && !handleOnly ? {} : dragHandlers,
  }
  const registerSurfaceMT = isHorizontal ? setSheetMTRef : setSurfaceMTRef

  const hasHorizontalInsets = !isHorizontal
    && (insets?.left !== undefined || insets?.right !== undefined)
  const initialLeft = hasHorizontalInsets
    ? Math.max(0, Number.isFinite(insets?.left) ? (insets?.left ?? 0) : 0)
    : undefined
  const initialRight = hasHorizontalInsets
    ? Math.max(0, Number.isFinite(insets?.right) ? (insets?.right ?? 0) : 0)
    : undefined
  const initialWidth = hasHorizontalInsets
    ? Math.max(0, screenWidth - (initialLeft ?? 0) - (initialRight ?? 0))
    : undefined

  function setPaintedViewRefMT(element: MainThread.Element | null) {
    'main thread'
    registerSurfaceMT(element)
    if (surfaceControllerRef) {
      surfaceControllerRef.current = element
        ? { setInsets: setInsetsMT, setCornerRadius: setCornerRadiusMT }
        : null
    }
  }

  useEffect(() => {
    if (!surfaceControllerRef) return
    runOnMainThread(() => {
      'main thread'
      if (surfaceControllerRef.current) {
        surfaceControllerRef.current = {
          setInsets: setInsetsMT,
          setCornerRadius: setCornerRadiusMT,
        }
      }
    })()
  }, [surfaceControllerRef, setInsetsMT, setCornerRadiusMT])

  const content = (
    <view
      {...(isHorizontal ? nativeProps : {})}
      {...innerViewProps}
      className={innerClassName}
      style={isHorizontal
        ? {
          position: 'absolute',
          top: 0,
          bottom: 0,
          ...(resolvedSide === 'left' ? { right: 0 } : { left: 0 }),
          height: '100%',
          ...innerStyle,
          ...(hasFitSnapPoint ? {} : { width: `${maxSnapSize}px` }),
        }
        : {
          width: '100%',
          position: 'relative',
          pointerEvents: 'auto',
          ...innerStyle,
          ...(hasFitSnapPoint ? {} : { height: '100%' }),
        }}
      event-through={false}
      main-thread:ref={setContentMTRef}
      main-thread:gesture={dragOnContent ? sheetGesture : undefined}
      main-thread:bindtouchstart={dragOnContent
        ? dragHandlers.handleTouchStartMT
        : undefined}
      main-thread:bindtouchmove={dragOnContent
        ? dragHandlers.handleTouchMoveMT
        : undefined}
      main-thread:bindtouchend={dragOnContent
        ? dragHandlers.handleTouchEndMT
        : undefined}
      main-thread:bindlayoutchange={handleSheetLayoutChangeMT}
    >
      <SheetDragContext.Provider value={sheetDragContext}>
        <SheetFooterContext.Provider value={footerContext}>
          <SheetBodyContext.Provider value={bodyContext}>
            {children}
          </SheetBodyContext.Provider>
        </SheetFooterContext.Provider>
      </SheetDragContext.Provider>
    </view>
  )

  if (isHorizontal) {
    return (
      <view
        className={className}
        style={{
          position: 'absolute',
          top: 0,
          ...(resolvedSide === 'left'
            ? { right: '100%' }
            : { left: '100%' }),
          width: positioner ? `${positioner.width * 1.5}px` : '150vw',
          height: positioner ? `${positioner.height}px` : '100vh',
          overflow: 'hidden',
          ...style,
          transition: 'none',
        }}
        main-thread:ref={surfaceControllerRef
          ? setPaintedViewRefMT
          : setSheetMTRef}
        implicit-animation='false'
        event-through={true}
        main-thread:bindlayoutchange={measureSurfaceMT}
      >
        {content}
      </view>
    )
  }

  return (
    <view
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
      main-thread:ref={setClipMTRef}
      implicit-animation='false'
      event-through={true}
    >
      <view
        style={{
          position: 'absolute',
          left: 0,
          ...(isTop
            ? {
              bottom: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }
            : { top: '100%' }),
          width: '100%',
          height: positioner ? `${positioner.height * 1.5}px` : '150vh',
          overflow: 'visible',
          pointerEvents: 'none',
          transition: 'none',
        }}
        main-thread:ref={setSheetMTRef}
        implicit-animation='false'
        event-through={true}
      >
        <view
          {...nativeProps}
          className={className}
          style={{
            position: 'relative',
            width: initialWidth === undefined ? '100%' : `${initialWidth}px`,
            ...(initialLeft === undefined ? {} : { left: `${initialLeft}px` }),
            ...(isTop
              ? {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }
              : {}),
            ...style,
            height: positioner ? `${positioner.height * 1.5}px` : '150vh',
            overflow: 'hidden',
            pointerEvents: 'auto',
          }}
          main-thread:ref={surfaceControllerRef
            ? setPaintedViewRefMT
            : setSurfaceMTRef}
          main-thread:bindlayoutchange={measureSurfaceMT}
          enable-new-animator={true}
          event-through={false}
          {...(dragOnSurface
            ? {
              'main-thread:gesture': sheetGesture,
              'main-thread:bindtouchstart': dragHandlers.handleTouchStartMT,
              'main-thread:bindtouchmove': dragHandlers.handleTouchMoveMT,
              'main-thread:bindtouchend': dragHandlers.handleTouchEndMT,
            }
            : {})}
        >
          <view
            style={{
              width: '100%',
              ...(hasFitSnapPoint ? {} : { height: `${maxSnapSize}px` }),
            }}
            main-thread:ref={setViewportMTRef}
            event-through={true}
          >
            {content}
          </view>
        </view>
      </view>
    </view>
  )
}
