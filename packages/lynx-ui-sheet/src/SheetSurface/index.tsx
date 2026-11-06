// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { GestureKind } from '@lynx-js/gesture-runtime'
import type { MainThread } from '@lynx-js/types'

import { SheetDragContext, SheetFooterContext } from '../context'
import type { SheetDragContextValue, SheetFooterContextValue } from '../context'
import type { SheetContentProps } from '../types'

export interface SheetSurfaceProps extends SheetContentProps {
  dragHandlers: SheetDragContextValue['dragHandlers']
  sheetGesture?: GestureKind
  resolvedSide: 'top' | 'bottom' | 'left' | 'right'
  handleOnly?: boolean
  snapPoints: Array<number | string>
  maxSnapSize: number
  footerContext: SheetFooterContextValue
  setClipMTRef: (element: MainThread.Element) => void
  setSurfaceMTRef: (element: MainThread.Element) => void
  setViewportMTRef: (element: MainThread.Element) => void
  setSheetMTRef: (element: MainThread.Element) => void
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
    snapAnimation: _snapAnimation,
    enterAnimation: _enterAnimation,
    exitAnimation: _exitAnimation,
    detached: _detached,
    bottomInset: _bottomInset,
    dragHandlers,
    sheetGesture,
    resolvedSide,
    handleOnly,
    snapPoints,
    maxSnapSize,
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
      main-thread:gesture={handleOnly ? undefined : sheetGesture}
      main-thread:bindtouchstart={handleOnly
        ? undefined
        : dragHandlers.handleTouchStartMT}
      main-thread:bindtouchmove={handleOnly
        ? undefined
        : dragHandlers.handleTouchMoveMT}
      main-thread:bindtouchend={handleOnly
        ? undefined
        : dragHandlers.handleTouchEndMT}
      main-thread:bindlayoutchange={handleSheetLayoutChangeMT}
    >
      <SheetDragContext.Provider
        value={{
          dragHandlers: sheetGesture && !handleOnly ? {} : dragHandlers,
        }}
      >
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
          width: '150vw',
          height: '100vh',
          overflow: 'hidden',
          ...style,
          transition: 'none',
        }}
        main-thread:ref={setSheetMTRef}
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
          height: '150vh',
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
            height: '150vh',
            overflow: 'hidden',
            pointerEvents: 'auto',
          }}
          main-thread:ref={setSurfaceMTRef}
          enable-new-animator={true}
          event-through={false}
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
