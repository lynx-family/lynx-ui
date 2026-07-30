// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react'
import type { MotionStyle, SpringOptions } from 'motion/react'
import * as motion from 'motion/react-client'
import { useLayoutEffect, useMemo } from 'react'
import type { JSX } from 'react'

import type { MotionStageProps } from './types'
import {
  OUTLINE_WEIGHT,
  SMOOTHING_OUTLINE_PATH,
  SMOOTHING_PATH,
} from '../../constants/stage'
import {
  computeDepthScale,
  computeScreenTranslation,
  toAlignFactor,
} from '../../utils'
import { useVisualSize } from '../context/use-visual-size'

const DEVICE_CLIP_PATH = `path("${SMOOTHING_PATH}")`
const DEVICE_OUTLINE_CLIP_PATH = `path("${SMOOTHING_OUTLINE_PATH}")`

const STAGE_ANCHOR_LOCKED_STYLE: MotionStyle = {
  position: 'relative',
  width: 0,
  height: 0,
  overflow: 'visible',
  pointerEvents: 'none',
}

const LAYER_BASE_LOCKED_STYLE: MotionStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  transformOrigin: 'top left',
  pointerEvents: 'none',
  willChange: 'transform',
}

const LAYER_CLIPPED_LOCKED_STYLE: MotionStyle = {
  ...LAYER_BASE_LOCKED_STYLE,
  overflow: 'hidden',
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

const DEFAULT_TRANSITION: SpringOptions = { stiffness: 170, damping: 26 }
const DEFAULT_WORLD: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 }

function MotionStage({
  width: widthProp,
  height: heightProp,
  baseWidth = 375,
  baseHeight = 812,
  fit = 'contain',
  fitProgress,
  zoom = 1,
  panX: screenPanX = 0,
  panY: screenPanY = 0,
  world = DEFAULT_WORLD,
  fitTransition = DEFAULT_TRANSITION,
  zoomTransition = DEFAULT_TRANSITION,
  panTransition = DEFAULT_TRANSITION,
  alignX = 'center',
  alignY = 'center',
  className,
  style,
  children,
  focalLength,
  maskColor = 'transparent',
  maskOpacity = 0,
  contentInteractive = false,
}: MotionStageProps): JSX.Element {
  // Graceful fallback: null when no VisualSizeProvider wraps this component
  const visualSizeCtx = useVisualSize()

  const outlineW = baseWidth + 2 * OUTLINE_WEIGHT
  const outlineH = baseHeight + 2 * OUTLINE_WEIGHT

  const deltaX = OUTLINE_WEIGHT
  const deltaY = OUTLINE_WEIGHT

  const baseW = useMotionValue(outlineW)
  const baseH = useMotionValue(outlineH)

  useLayoutEffect(() => {
    baseW.set(outlineW)
    baseH.set(outlineH)
  }, [outlineW, outlineH, baseW, baseH])

  const width = widthProp
    ?? visualSizeCtx?.visualW ?? baseW

  const height = heightProp
    ?? visualSizeCtx?.visualH ?? baseH

  const ax = toAlignFactor(alignX)
  const ay = toAlignFactor(alignY)

  const ratioW = useTransform(() => width.get() / baseW.get())
  const ratioH = useTransform(() => height.get() / baseH.get())

  const tMv = useMotionValue(0)
  const zMv = useMotionValue(1)

  useLayoutEffect(() => {
    if (typeof fitProgress === 'number') {
      tMv.set(clamp01(fitProgress))
    } else {
      tMv.set(fit === 'cover' ? 1 : 0)
    }
  }, [fit, fitProgress, tMv])

  useLayoutEffect(() => {
    zMv.set(zoom ?? 1)
  }, [zoom, zMv])

  const minScale = useTransform(() => Math.min(ratioW.get(), ratioH.get()))
  const maxScale = useTransform(() => Math.max(ratioW.get(), ratioH.get()))

  const fitSpring = useSpring(tMv, fitTransition)
  const zoomSpring = useSpring(zMv, zoomTransition)

  // ===== Camera (perspective) layer =====
  const { x: worldX = 0, y: worldY = 0, z: worldZ = 0 } = world

  // k = f/(f-z), or 1 when no perspective
  const k = computeDepthScale(focalLength, worldZ)

  // principal-point compensation so the center stays visually fixed
  const { x: panX, y: panY } = computeScreenTranslation({
    worldX,
    worldY,
    depthScale: k,
    screenPanX,
    screenPanY,
  })

  const zoomCamMv = useMotionValue(k)
  const panXMv = useMotionValue(panX)
  const panYMv = useMotionValue(panY)

  useLayoutEffect(() => {
    zoomCamMv.set(k)
  }, [k, zoomCamMv])

  useLayoutEffect(() => {
    panXMv.set(panX)
  }, [panX, panXMv])

  useLayoutEffect(() => {
    panYMv.set(panY)
  }, [panY, panYMv])

  const zoomCamSpring = useSpring(zoomCamMv, zoomTransition)
  const panXSpring = useSpring(panXMv, panTransition)
  const panYSpring = useSpring(panYMv, panTransition)

  const scale = useTransform(() =>
    (minScale.get() + (maxScale.get() - minScale.get()) * fitSpring.get())
    * zoomSpring.get() * zoomCamSpring.get()
  )

  const outlineX = useTransform(() => -(outlineW * scale.get()) * ax)
  const outlineY = useTransform(() => -(outlineH * scale.get()) * ay)
  const frameX = useTransform(() => outlineX.get() + deltaX * scale.get())
  const frameY = useTransform(() => outlineY.get() + deltaY * scale.get())

  const frameTransform =
    useMotionTemplate`translate(${panXSpring}px, ${panYSpring}px) translate(${frameX}px, ${frameY}px) scale(${scale})`
  const outlineTransform =
    useMotionTemplate`translate(${panXSpring}px, ${panYSpring}px) translate(${outlineX}px, ${outlineY}px) scale(${scale})`

  const outlineLayerStyle = useMemo<MotionStyle>(() => ({
    ...LAYER_BASE_LOCKED_STYLE,
    width: outlineW,
    height: outlineH,
    clipPath: DEVICE_OUTLINE_CLIP_PATH,
  }), [outlineW, outlineH])

  const frameLayerStyle = useMemo<MotionStyle>(() => ({
    ...LAYER_CLIPPED_LOCKED_STYLE,
    width: baseWidth,
    height: baseHeight,
    clipPath: DEVICE_CLIP_PATH,
  }), [baseWidth, baseHeight])

  const maskLayerStyle = useMemo<MotionStyle>(() => ({
    ...LAYER_BASE_LOCKED_STYLE,
    width: baseWidth,
    height: baseHeight,
    clipPath: DEVICE_CLIP_PATH,
  }), [baseWidth, baseHeight])

  return (
    <motion.div style={STAGE_ANCHOR_LOCKED_STYLE}>
      {/* Device outline */}
      <motion.div
        className={className}
        style={{
          ...(style as MotionStyle | undefined),
          ...outlineLayerStyle,
          transform: outlineTransform,
        }}
      />

      {/* Device frame */}
      <motion.div
        style={{
          ...frameLayerStyle,
          pointerEvents: contentInteractive ? 'auto' : 'none',
          transform: frameTransform,
        }}
      >
        {children}
      </motion.div>

      {/* Mask layer */}
      <motion.div
        style={{
          ...maskLayerStyle,
          transform: frameTransform,
          backgroundColor: maskColor,
        }}
        animate={{ opacity: maskOpacity }}
        transition={DEFAULT_TRANSITION}
      />
    </motion.div>
  )
}

export { MotionStage }
