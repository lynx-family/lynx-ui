// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { forwardRef, useMemo, useRef } from 'react'
import type {
  CSSProperties,
  ComponentPropsWithoutRef,
  DetailedHTMLProps,
  ForwardRefExoticComponent,
  ForwardedRef,
  HTMLAttributes,
  RefAttributes,
} from 'react'
import type { JSX } from 'react/jsx-runtime'

import {
  OUTLINE_WEIGHT,
  SMOOTHING_OUTLINE_PATH,
  SMOOTHING_PATH,
} from '../../constants/stage'
import { useContainerResize } from '../../hooks/use-container-resize'
import { useMergedRefs } from '../../hooks/use-merged-refs'
import type { StageProps } from '../../types'
import {
  computeFrameOffset,
  computeScaleRange,
  lerpFitScale,
  toAlignFactor,
} from '../../utils'
import { createContextWithProvider } from '../context'

const [StageSizeProvider, useOptionalStageSize] = createContextWithProvider<
  { width: number, height: number }
>('Stage', undefined, { throwIfMissing: false })

const DEVICE_CLIP_PATH = `path("${SMOOTHING_PATH}")`
const DEVICE_OUTLINE_CLIP_PATH = `path("${SMOOTHING_OUTLINE_PATH}")`

const VIEWPORT_LOCKED_STYLE: CSSProperties = {
  position: 'relative',
  overflow: 'visible',
  pointerEvents: 'none',
}

const VIEWPORT_FILL_STYLE: CSSProperties = {
  ...VIEWPORT_LOCKED_STYLE,
  width: '100%',
  height: '100%',
}

const STAGE_ANCHOR_STYLE: CSSProperties = {
  width: 0,
  height: 0,
  transform: 'none',
  filter: 'none',
  perspective: 'none',
  backdropFilter: 'none',
  willChange: 'auto',
  contain: 'none',
  overflow: 'visible',
  pointerEvents: 'none',
}

const ANCHOR_LOCKED_STYLE: CSSProperties = {
  ...STAGE_ANCHOR_STYLE,
  position: 'absolute',
}

const ANCHOR_CENTER_STYLE: CSSProperties = {
  ...ANCHOR_LOCKED_STYLE,
  left: '50%',
  top: '50%',
}

const DEVICE_OUTLINE_LOCKED_STYLE: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  transformOrigin: 'top left',
  pointerEvents: 'none',
  clipPath: DEVICE_OUTLINE_CLIP_PATH,
}

const DEVICE_FRAME_LOCKED_STYLE: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  transformOrigin: 'top left',
  overflow: 'hidden',
  cursor: 'pointer',
  pointerEvents: 'none',
  clipPath: DEVICE_CLIP_PATH,
}

function Stage({
  className,
  style,
  width: widthProp,
  height: heightProp,
  fit = 'contain',
  alignX = 'center',
  alignY = 'center',
  placeX,
  placeY,
  children,
  baseWidth = 375,
  baseHeight = 812,
  zoom = 1,
  panX = 0,
  panY = 0,
}: StageProps): JSX.Element {
  const ctx = useOptionalStageSize()

  const containerWidth = widthProp
    ?? ctx?.width ?? baseWidth

  const containerHeight = heightProp
    ?? ctx?.height ?? baseHeight

  const scaleInfo = useMemo(() => {
    const scaleRange = computeScaleRange({
      containerWidth,
      containerHeight,
      baseWidth,
      baseHeight,
    })
    const scale = lerpFitScale(scaleRange, fit === 'cover' ? 1 : 0) * zoom

    const ax = toAlignFactor(alignX)
    const ay = toAlignFactor(alignY)

    const { offsetX, offsetY } = computeFrameOffset({
      ax,
      ay,
      scale,
      baseWidth,
      baseHeight,
    })

    return { scale, offsetX: offsetX + panX, offsetY: offsetY + panY }
  }, [
    containerWidth,
    containerHeight,
    baseWidth,
    baseHeight,
    fit,
    alignX,
    alignY,
    zoom,
    panX,
    panY,
  ])

  const resolvedPlaceX = placeX ?? alignX
  const resolvedPlaceY = placeY ?? alignY

  const hasMeasuredCtx = ctx !== undefined

  const viewportStyle = useMemo<CSSProperties>(() => {
    if (widthProp === undefined && heightProp === undefined) {
      if (hasMeasuredCtx) {
        return VIEWPORT_FILL_STYLE
      }
      return {
        ...VIEWPORT_LOCKED_STYLE,
        width: containerWidth,
        height: containerHeight,
      }
    }
    return {
      ...VIEWPORT_LOCKED_STYLE,
      width: widthProp ?? containerWidth,
      height: heightProp ?? containerHeight,
    }
  }, [
    widthProp,
    heightProp,
    hasMeasuredCtx,
    containerWidth,
    containerHeight,
  ])

  const anchorStyle = useMemo<CSSProperties>(() => {
    if (resolvedPlaceX === 'center' && resolvedPlaceY === 'center') {
      return ANCHOR_CENTER_STYLE
    }
    const ax = toAlignFactor(resolvedPlaceX)
    const ay = toAlignFactor(resolvedPlaceY)
    return {
      ...ANCHOR_LOCKED_STYLE,
      left: `${ax * 100}%`,
      top: `${ay * 100}%`,
    }
  }, [resolvedPlaceX, resolvedPlaceY])

  return (
    <div
      style={viewportStyle}
    >
      {/* Anchor & coordinate system element, no size */}
      <div
        style={anchorStyle}
      >
        {/* Device outline */}
        <div
          className={className}
          style={{
            ...style,
            ...DEVICE_OUTLINE_LOCKED_STYLE,
            width: baseWidth + 2 * OUTLINE_WEIGHT,
            height: baseHeight + 2 * OUTLINE_WEIGHT,
            transform: `translate(${
              scaleInfo.offsetX - OUTLINE_WEIGHT * scaleInfo.scale
            }px, ${
              scaleInfo.offsetY - OUTLINE_WEIGHT * scaleInfo.scale
            }px) scale(${scaleInfo.scale})`,
          }}
        />

        {/* Device frame */}
        <div
          style={{
            ...DEVICE_FRAME_LOCKED_STYLE,
            width: baseWidth,
            height: baseHeight,
            transform:
              `translate(${scaleInfo.offsetX}px, ${scaleInfo.offsetY}px) scale(${scaleInfo.scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

type StageContainerProps = ComponentPropsWithoutRef<'div'> & {
  fallbackWidth?: number
  fallbackHeight?: number
}

function StageContainerImpl(
  props: StageContainerProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { fallbackWidth = 0, fallbackHeight = 0, children, ...restProps } =
    props

  const containerRef = useRef<HTMLDivElement | null>(null)
  const { width = fallbackWidth, height = fallbackHeight } = useContainerResize(
    {
      ref: containerRef,
    },
  )

  const mergedRef = useMergedRefs(containerRef, ref)

  return (
    <StageSizeProvider
      width={width}
      height={height}
    >
      <div ref={mergedRef} {...restProps}>
        {children}
      </div>
    </StageSizeProvider>
  )
}

const StageContainer: ForwardRefExoticComponent<
  & Omit<
    DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
    'ref'
  >
  & {
    fallbackWidth?: number
    fallbackHeight?: number
  }
  & RefAttributes<HTMLDivElement>
> = forwardRef(StageContainerImpl)

export { Stage, StageContainer }
