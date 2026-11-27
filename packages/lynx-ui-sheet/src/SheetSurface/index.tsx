// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useRef } from '@lynx-js/react'

import type { GestureKind } from '@lynx-js/gesture-runtime'
import type { MainThread } from '@lynx-js/types'

import {
  SheetBodyContext,
  SheetDragContext,
  SheetFooterContext,
  getInternalSheetSurface,
} from '../context'
import type {
  SheetBodyContextValue,
  SheetDragContextValue,
  SheetFooterContextValue,
  SheetPositionerDimensions,
  SheetSurfaceRenderSeed,
} from '../context'
import type { SheetContentProps, SheetSnapPoint } from '../types'
import { isFitSnapPoint } from '../utils/direction'

export interface SheetSurfaceProps extends SheetContentProps {
  dragHandlers: SheetDragContextValue['dragHandlers']
  sheetGesture?: GestureKind
  resolvedSide: 'top' | 'bottom' | 'left' | 'right'
  enableRTL: boolean
  handleOnly?: boolean
  snapPoints: SheetSnapPoint[]
  maxSnapSize: number
  fitMaxSize?: number
  screenWidth: number
  screenHeight?: number
  positioner?: SheetPositionerDimensions | null
  footerContext: SheetFooterContextValue
  bodyContext: SheetBodyContextValue
  measureSurfaceMT: (event: MainThread.LayoutChangeEvent) => void
  setClipMTRef: (element: MainThread.Element | null) => void
  setSurfaceMTRef: (
    element: MainThread.Element | null,
    renderedStyleKey?: string,
  ) => void
  setViewportMTRef: (element: MainThread.Element) => void
  setSheetMTRef: (element: MainThread.Element | null) => void
  setContentMTRef: (element: MainThread.Element) => void
  handleSheetLayoutChangeMT: (event: {
    detail?: { height?: number, width?: number }
    params?: { height?: number, width?: number }
  }) => void
}

function serializeStyleKey(
  styleObj: Record<string, unknown> | undefined,
): string {
  if (!styleObj) return ''
  let out = ''
  for (const key in styleObj) {
    const val = styleObj[key]
    if (
      typeof val === 'string'
      || typeof val === 'number'
      || typeof val === 'boolean'
    ) {
      out += `${key}:${val};`
    }
  }
  return out
}

export function SheetSurface(props: SheetSurfaceProps) {
  const {
    children,
    className,
    style,
    innerClassName,
    innerStyle,
    surfaceViewProps,
    innerViewProps,
    surface,
    snapAnimation: _snapAnimation,
    enterAnimation: _enterAnimation,
    exitAnimation: _exitAnimation,
    dragHandlers,
    sheetGesture,
    resolvedSide,
    enableRTL,
    handleOnly,
    snapPoints,
    maxSnapSize,
    fitMaxSize,
    screenWidth,
    screenHeight,
    positioner,
    footerContext,
    bodyContext,
    measureSurfaceMT,
    setClipMTRef,
    setSurfaceMTRef,
    setViewportMTRef,
    setSheetMTRef,
    setContentMTRef,
    handleSheetLayoutChangeMT,
  } = props
  const isHorizontal = resolvedSide === 'left' || resolvedSide === 'right'
  const isTop = resolvedSide === 'top'
  const isBottom = resolvedSide === 'bottom'
  const hasFitSnapPoint = snapPoints.some(point => isFitSnapPoint(point))
  const dragOnContent = isHorizontal && !handleOnly
  const dragOnSurface = !isHorizontal && !handleOnly
  const sheetDragContext = {
    dragHandlers: sheetGesture && !handleOnly ? {} : dragHandlers,
  }

  const internalSurface = getInternalSheetSurface(surface)
  const mountSeedRef = useRef<SheetSurfaceRenderSeed | null | undefined>(
    undefined,
  )
  if (mountSeedRef.current === undefined) {
    mountSeedRef.current = internalSurface
      ? internalSurface.resolveRenderSeed(resolvedSide, screenWidth, enableRTL)
      : null
  }
  const seed = mountSeedRef.current
  const initialCornerStyle = seed?.cornerStyle
  const initialLeft = seed?.horizontalBounds?.left
  const initialWidth = seed?.horizontalBounds?.width
  const initialBottomInset = isBottom ? (seed?.bottomInset ?? 0) : 0
  const initialViewportHeight = isBottom && screenHeight !== undefined
    ? Math.min(maxSnapSize, Math.max(0, screenHeight - initialBottomInset))
    : maxSnapSize

  const horizontalPaintedStyle = {
    position: 'absolute' as const,
    top: 0,
    ...(resolvedSide === 'left'
      ? { right: '100%' }
      : { left: '100%' }),
    width: screenWidth ? `${screenWidth * 1.5}px` : '150vw',
    height: screenHeight ? `${screenHeight}px` : '100vh',
    overflow: 'hidden' as const,
    ...style,
    ...initialCornerStyle,
    transition: 'none',
  }
  const verticalPaintedStyle = {
    position: 'relative' as const,
    width: '100%',
    ...(isTop
      ? {
        display: 'flex' as const,
        flexDirection: 'column' as const,
        justifyContent: 'flex-end' as const,
      }
      : {}),
    ...style,
    ...initialCornerStyle,
    ...(initialWidth === undefined
      ? {}
      : { width: `${initialWidth}px` }),
    ...(initialLeft === undefined
      ? {}
      : { transform: `translateX(${initialLeft}px)` }),
    height: screenHeight
      ? `${screenHeight * 1.5}px`
      : '150vh',
    overflow: 'hidden' as const,
    pointerEvents: 'auto' as const,
  }
  const paintedStyleKey = internalSurface
    ? serializeStyleKey(
      isHorizontal ? horizontalPaintedStyle : verticalPaintedStyle,
    )
    : undefined

  function setVerticalPaintedRefMT(element: MainThread.Element | null) {
    'main thread'
    if (element) {
      setSurfaceMTRef(element, paintedStyleKey)
    } else {
      setSurfaceMTRef(null)
    }
  }

  const content = (
    <view
      {...innerViewProps}
      className={innerClassName}
      style={isHorizontal
        ? {
          position: 'absolute',
          top: 0,
          bottom: 0,
          ...(resolvedSide === 'left' ? { right: 0 } : { left: 0 }),
          height: '100%',
          ...(hasFitSnapPoint && maxSnapSize === 0 && fitMaxSize !== undefined
            ? { maxWidth: `${fitMaxSize}px` }
            : {}),
          ...innerStyle,
          ...(hasFitSnapPoint ? {} : { width: `${maxSnapSize}px` }),
        }
        : {
          width: '100%',
          position: 'relative',
          pointerEvents: 'auto',
          ...(hasFitSnapPoint && maxSnapSize === 0 && fitMaxSize !== undefined
            ? { maxHeight: `${fitMaxSize}px` }
            : {}),
          ...innerStyle,
          ...(hasFitSnapPoint ? {} : { height: '100%' }),
        }}
      event-through={false}
      implicit-animation='false'
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
        implicit-animation='false'
        {...surfaceViewProps}
        className={className}
        style={horizontalPaintedStyle}
        main-thread:ref={setSheetMTRef}
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
      main-thread:ref={internalSurface ? setClipMTRef : undefined}
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
          height: positioner?.height ? `${positioner.height * 1.5}px` : '150vh',
          overflow: 'visible',
          pointerEvents: 'none',
          transition: 'none',
        }}
        main-thread:ref={setSheetMTRef}
        implicit-animation='false'
        event-through={true}
      >
        <view
          implicit-animation='false'
          {...surfaceViewProps}
          className={className}
          style={verticalPaintedStyle}
          main-thread:ref={setVerticalPaintedRefMT}
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
              ...(hasFitSnapPoint
                ? {}
                : { height: `${initialViewportHeight}px` }),
            }}
            main-thread:ref={setViewportMTRef}
            implicit-animation='false'
            event-through={true}
          >
            {content}
          </view>
        </view>
      </view>
    </view>
  )
}
