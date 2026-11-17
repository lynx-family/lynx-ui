// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { GestureKind } from '@lynx-js/gesture-runtime'
import type { MainThread } from '@lynx-js/types'

import { SheetDragContext, SheetFooterContext } from '../context'
import type {
  SheetDragContextValue,
  SheetFooterContextValue,
  SheetPositionerDimensions,
} from '../context'
import type { SheetContentProps, SheetNestedScrollContentProps } from '../types'

export interface SheetSurfaceProps
  extends
    SheetContentProps,
    Pick<SheetNestedScrollContentProps, 'contentViewport'>
{
  dragHandlers: SheetDragContextValue['dragHandlers']
  sheetGesture?: GestureKind
  resolvedSide: 'top' | 'bottom' | 'left' | 'right'
  handleOnly?: boolean
  snapPoints: Array<number | string>
  maxSnapSize: number
  positioner?: SheetPositionerDimensions | null
  footerContext: SheetFooterContextValue
  setClipMTRef: (element: MainThread.Element) => void
  setSurfaceMTRef: (element: MainThread.Element | null) => void
  setViewportMTRef: (element: MainThread.Element) => void
  setSheetMTRef: (element: MainThread.Element | null) => void
  setContentMTRef: (element: MainThread.Element) => void
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
    'main-thread:surfaceRef': surfaceRef,
    snapAnimation: _snapAnimation,
    enterAnimation: _enterAnimation,
    exitAnimation: _exitAnimation,
    detached,
    contentViewport,
    bottomInset: _bottomInset,
    dragHandlers,
    sheetGesture,
    resolvedSide,
    handleOnly,
    snapPoints,
    maxSnapSize,
    positioner,
    footerContext,
    setClipMTRef,
    setSurfaceMTRef,
    setViewportMTRef,
    setSheetMTRef,
    setContentMTRef,
    handleSheetLayoutChangeMT,
    ...nativeProps
  } = props
  const isHorizontal = resolvedSide === 'left' || resolvedSide === 'right'
  const isTop = resolvedSide === 'top'
  const hasFitSnapPoint = snapPoints.some(p => String(p).trim() === 'fit')
  const useContentViewport = resolvedSide === 'bottom' && detached
    && !hasFitSnapPoint
    && contentViewport !== undefined
  const dragOnContent = !handleOnly && !useContentViewport
  const viewportHandle = contentViewport?.handle
  const handleHeight = contentViewport?.handleHeight ?? 0
  const handleSize = Number.isFinite(handleHeight)
    ? Math.max(0, handleHeight)
    : 0
  const sheetDragContext = {
    dragHandlers: sheetGesture && !handleOnly ? {} : dragHandlers,
  }
  const registerSurfaceMT = isHorizontal ? setSheetMTRef : setSurfaceMTRef

  function setPaintedViewRefMT(element: MainThread.Element | null) {
    'main thread'
    registerSurfaceMT(element)
    if (surfaceRef) surfaceRef.current = element
  }

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
        <SheetFooterContext.Provider
          value={footerContext}
        >
          {children}
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
        main-thread:ref={surfaceRef ? setPaintedViewRefMT : setSheetMTRef}
        implicit-animation='false'
        event-through={true}
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
            width: '100%',
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
          main-thread:ref={surfaceRef ? setPaintedViewRefMT : setSurfaceMTRef}
          enable-new-animator={true}
          event-through={false}
          main-thread:gesture={useContentViewport && !handleOnly
            ? sheetGesture
            : undefined}
        >
          <view
            style={{
              width: '100%',
              ...(useContentViewport
                ? { position: 'absolute', left: 0, bottom: 0 }
                : {}),
              ...(hasFitSnapPoint ? {} : { height: `${maxSnapSize}px` }),
            }}
            main-thread:ref={setViewportMTRef}
            event-through={true}
          >
            {content}
          </view>
          {useContentViewport && viewportHandle != null && (
            <view
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${handleSize}px`,
              }}
            >
              <SheetDragContext.Provider value={sheetDragContext}>
                {viewportHandle}
              </SheetDragContext.Provider>
            </view>
          )}
        </view>
      </view>
    </view>
  )
}
