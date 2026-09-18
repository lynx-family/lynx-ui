// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { GestureKind } from '@lynx-js/gesture-runtime'
import type { MainThread } from '@lynx-js/types'

import { SheetDragContext } from '../context'
import type { SheetDragContextValue } from '../context'
import type { SheetContentProps } from '../types'

export interface SheetSurfaceProps extends SheetContentProps {
  dragHandlers: SheetDragContextValue['dragHandlers']
  sheetGesture?: GestureKind
  resolvedSide: 'top' | 'bottom' | 'left' | 'right'
  handleOnly?: boolean
  snapPoints: Array<number | string>
  maxSnapSize: number
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
    snapAnimation: _snapAnimation,
    enterAnimation: _enterAnimation,
    exitAnimation: _exitAnimation,
    dragHandlers,
    sheetGesture,
    resolvedSide,
    handleOnly,
    snapPoints,
    maxSnapSize,
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
      {...nativeProps}
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
          ...innerStyle,
          ...(hasFitSnapPoint ? {} : { height: `${maxSnapSize}px` }),
        }}
      event-through={false}
      main-thread:ref={setContentMTRef}
      main-thread:gesture={isHorizontal && !handleOnly
        ? sheetGesture
        : undefined}
      main-thread:bindtouchstart={isHorizontal && !handleOnly
        ? dragHandlers.handleTouchStartMT
        : undefined}
      main-thread:bindtouchmove={isHorizontal && !handleOnly
        ? dragHandlers.handleTouchMoveMT
        : undefined}
      main-thread:bindtouchend={isHorizontal && !handleOnly
        ? dragHandlers.handleTouchEndMT
        : undefined}
      main-thread:bindlayoutchange={handleSheetLayoutChangeMT}
    >
      <SheetDragContext.Provider value={{ dragHandlers }}>
        {children}
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
          transform: 'translate(0px, 0px)',
          ...style,
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
      className={className}
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
        width: '100vw',
        height: '150vh',
        overflow: 'hidden',
        transform: 'translate(0px, 0px)',
        ...style,
      }}
      main-thread:ref={setSheetMTRef}
      implicit-animation='false'
      event-through={false}
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
    >
      {content}
    </view>
  )
}
