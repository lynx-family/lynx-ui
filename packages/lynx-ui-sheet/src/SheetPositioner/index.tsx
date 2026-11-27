// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from '@lynx-js/react'

import type { LayoutChangeEvent } from '@lynx-js/types'
import { clsx } from 'clsx'

import { SheetContext, SheetPositionerContext } from '../context'
import type { SheetPositionerDimensions } from '../context'
import type { SheetPositionerProps, SheetSurfaceSize } from '../types'
import { getDefaultScreenSize } from '../utils/direction'
import { parseSurfaceSize } from '../utils/surfaceFrame'

function parseStyleOffsetPx(value: unknown): number {
  const parsed = parseSurfaceSize(value as SheetSurfaceSize | undefined)
  return parsed?.kind === 'px' ? parsed.value : 0
}

/** Establish local layout and calculation bounds, synchronously or via auto-measurement. */
export function SheetPositioner(props: SheetPositionerProps) {
  const {
    width,
    height,
    onSizeChange,
    children,
    className,
    style,
    positionerProps,
  } = props
  if (width !== undefined && (!Number.isFinite(width) || width <= 0)) {
    throw new Error('SheetPositioner width must be a positive pixel number')
  }
  if (height !== undefined && (!Number.isFinite(height) || height <= 0)) {
    throw new Error('SheetPositioner height must be a positive pixel number')
  }
  const insetX = width === undefined
    ? parseStyleOffsetPx(style?.left) + parseStyleOffsetPx(style?.right)
    : 0
  const insetY = height === undefined
    ? parseStyleOffsetPx(style?.top) + parseStyleOffsetPx(style?.bottom)
    : 0
  const isDefaultFullViewport = width === undefined
    && height === undefined
    && insetX === 0
    && insetY === 0
  const sheetContext = useContext(SheetContext)
  const sizeCacheRef = isDefaultFullViewport
    ? sheetContext?.positionerSizeCacheRef
    : undefined
  const defaultScreen = getDefaultScreenSize()
  const hostKey = `${sheetContext?.screenWidth ?? defaultScreen.width}x${
    sheetContext?.screenHeight ?? defaultScreen.height
  }`
  const cachedSize = sizeCacheRef?.current?.hostKey === hostKey
    ? { width: sizeCacheRef.current.width, height: sizeCacheRef.current.height }
    : null

  const [measured, setMeasured] = useState<
    { width: number, height: number } | null
  >(cachedSize)
  const effectiveMeasured = measured ?? cachedSize
  const resolvedWidth = width ?? effectiveMeasured?.width
  const resolvedHeight = height ?? effectiveMeasured?.height
  const dimensions = useMemo<SheetPositionerDimensions | null>(
    () => {
      if (resolvedWidth !== undefined && resolvedHeight !== undefined) {
        return { width: resolvedWidth, height: resolvedHeight }
      }
      if (insetX > 0 || insetY > 0) {
        return { insetX, insetY }
      }
      return null
    },
    [resolvedWidth, resolvedHeight, insetX, insetY],
  )
  const onSizeChangeRef = useRef(onSizeChange)
  onSizeChangeRef.current = onSizeChange
  const lastNotifiedRef = useRef<{ width: number, height: number } | null>(null)
  const needsMeasure = width === undefined || height === undefined

  useEffect(() => {
    if (
      dimensions?.width === undefined
      || dimensions.height === undefined
    ) return
    const previous = lastNotifiedRef.current
    if (
      previous?.width === dimensions.width
      && previous.height === dimensions.height
    ) return
    const nextSize = { width: dimensions.width, height: dimensions.height }
    lastNotifiedRef.current = nextSize
    onSizeChangeRef.current?.(nextSize)
  }, [dimensions])

  function handleLayoutChange(event: LayoutChangeEvent) {
    const { width: nextWidth, height: nextHeight } = event.detail
    if (nextWidth > 0 && nextHeight > 0) {
      if (sizeCacheRef) {
        sizeCacheRef.current = { hostKey, width: nextWidth, height: nextHeight }
      }
      if (
        effectiveMeasured === null
        && isDefaultFullViewport
        && Math.abs(
            nextWidth - (sheetContext?.screenWidth ?? defaultScreen.width),
          ) < 0.5
        && Math.abs(
            nextHeight - (sheetContext?.screenHeight ?? defaultScreen.height),
          ) < 0.5
      ) {
        const previous = lastNotifiedRef.current
        if (
          previous?.width !== nextWidth
          || previous.height !== nextHeight
        ) {
          const nextSize = { width: nextWidth, height: nextHeight }
          lastNotifiedRef.current = nextSize
          onSizeChangeRef.current?.(nextSize)
        }
        positionerProps?.bindlayoutchange?.(event)
        return
      }
      setMeasured(previous =>
        previous?.width === nextWidth && previous.height === nextHeight
          ? previous
          : { width: nextWidth, height: nextHeight }
      )
    }
    positionerProps?.bindlayoutchange?.(event)
  }

  return (
    <SheetPositionerContext.Provider value={dimensions}>
      <view
        {...positionerProps}
        className={clsx('lynx-ui-sheet__positioner', className)}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          pointerEvents: 'none',
          ...(width === undefined ? { right: 0 } : {}),
          ...(height === undefined ? { bottom: 0 } : {}),
          ...style,
          ...(width === undefined ? {} : { width: `${width}px` }),
          ...(height === undefined ? {} : { height: `${height}px` }),
          overflow: 'hidden',
        }}
        event-through={true}
        bindlayoutchange={needsMeasure
          ? handleLayoutChange
          : positionerProps?.bindlayoutchange}
      >
        {children}
      </view>
    </SheetPositionerContext.Provider>
  )
}
