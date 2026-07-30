// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMotionValue, useTransform } from 'motion/react'
import type { MotionStyle, TransformTemplate } from 'motion/react'
import * as motion from 'motion/react-client'
import { forwardRef, useRef } from 'react'
import type {
  ForwardRefExoticComponent,
  ForwardedRef,
  RefAttributes,
} from 'react'

import { getLastScaleFromTransform } from './transform-utils'
import type { MotionStageContainerProps } from './types'
import { useContainerResizeMV } from './use-container-resize-mv'
import { useMergedRefs } from '../../hooks/use-merged-refs'
import { VisualSizeProvider } from '../context/visual-size-provider'

const CONTAINER_LOCKED_STYLE: MotionStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
}

const ANCHOR_LOCKED_STYLE: MotionStyle = {
  position: 'relative',
  width: 4,
  height: 4,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'visible',
}

/**
 * Layout-animation container that neutralizes Motion's scale side effects.
 *
 * Framer Motion uses `transform: scale(...)` for layout animations to avoid
 * reflow. This scales descendants as well, distorting their coordinate space.
 *
 * We use a two-layer structure:
 * - outer: participates in layout animation (may be scaled)
 * - inner: stable anchor for children
 *
 * Instead of applying inverse transforms, we extract the scale and reconstruct
 * the "visual size" (layout × scale), exposing it via context so children render
 * against stable dimensions.
 *
 * Note:
 * This component is typically used inside `AnimatePresence mode="popLayout"`,
 * so it must forward its ref to the underlying DOM node, as `popLayout` needs
 * that DOM node to measure the element's position and then temporarily take
 * the exiting node out of normal layout flow while siblings reflow.
 */
const MotionStageContainer: ForwardRefExoticComponent<
  MotionStageContainerProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, MotionStageContainerProps>(
  MotionStageContainerImpl,
)

function MotionStageContainerImpl(
  props: MotionStageContainerProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    children,
    className,
    layoutId,
    style,
    onLayoutMeasure,
    onLayoutAnimationStart,
    onLayoutAnimationComplete,
    ...restProps
  } = props

  const containerRef = useRef<HTMLDivElement | null>(null)

  // Layout size from ResizeObserver (untransformed border-box)
  const { width: layoutW, height: layoutH } = useContainerResizeMV(
    containerRef,
  )

  const mergedRef = useMergedRefs(containerRef, ref)

  // Frozen base size during layout animation (snapshot at measure/start)
  const animLayoutW = useMotionValue(layoutW.get())
  const animLayoutH = useMotionValue(layoutH.get())

  // Animation phase flag: 0 (idle) / 1 (animating)
  const isAnimating = useMotionValue(0)

  // Parent scale extracted from transformTemplate
  const scaleX = useMotionValue(1)
  const scaleY = useMotionValue(1)

  // Visual size in the local transform coord system: base × scale
  const visualW = useTransform(() =>
    (isAnimating.get() ? animLayoutW.get() : layoutW.get()) * scaleX.get()
  )
  const visualH = useTransform(() =>
    (isAnimating.get() ? animLayoutH.get() : layoutH.get()) * scaleY.get()
  )

  const handleParentTransform: TransformTemplate = (
    _latest,
    generated,
  ) => {
    if (generated && generated !== 'none') {
      const s = getLastScaleFromTransform(generated)
      if (s) {
        scaleX.set(s.x)
        scaleY.set(s.y)
      } else {
        scaleX.set(1)
        scaleY.set(1)
      }
    } else {
      scaleX.set(1)
      scaleY.set(1)
    }
    return generated
  }

  const handleLayoutMeasure = (
    ...args: Parameters<
      NonNullable<MotionStageContainerProps['onLayoutMeasure']>
    >
  ) => {
    const [box] = args
    // Forward consumer callbacks while guaranteeing internal MotionValue updates
    // always run even if the consumer callback throws.
    try {
      onLayoutMeasure?.(...args)
    } finally {
      animLayoutW.set(box.x.max - box.x.min)
      animLayoutH.set(box.y.max - box.y.min)
    }
  }

  const handleLayoutAnimationStart = (
    ...args: Parameters<
      NonNullable<MotionStageContainerProps['onLayoutAnimationStart']>
    >
  ) => {
    // Forward consumer callbacks while guaranteeing internal MotionValue updates
    // always run even if the consumer callback throws.
    try {
      onLayoutAnimationStart?.(...args)
    } finally {
      isAnimating.set(1)
    }
  }

  const handleLayoutAnimationComplete = (
    ...args: Parameters<
      NonNullable<MotionStageContainerProps['onLayoutAnimationComplete']>
    >
  ) => {
    // Forward consumer callbacks while guaranteeing internal MotionValue updates
    // always run even if the consumer callback throws.
    try {
      onLayoutAnimationComplete?.(...args)
    } finally {
      isAnimating.set(0)
      animLayoutW.set(layoutW.get())
      animLayoutH.set(layoutH.get())
      scaleX.set(1)
      scaleY.set(1)
    }
  }

  const mergedContainerStyle: MotionStyle = style === undefined
    ? CONTAINER_LOCKED_STYLE
    : { ...(style as MotionStyle), ...CONTAINER_LOCKED_STYLE }

  return (
    // Two-layer layout shell:
    // outer applies scale S; inner defines stable coords.
    // We effectively apply an inverse transform (S⁻¹), but instead of
    // nesting transforms, we reconstruct visual size: V = L × S,
    // so children render in a scale-invariant space.
    <motion.div
      {...restProps}
      layout
      layoutId={`_${layoutId}_parent`}
      layoutCrossfade={false}
      ref={mergedRef}
      onLayoutMeasure={handleLayoutMeasure}
      onLayoutAnimationStart={handleLayoutAnimationStart}
      onLayoutAnimationComplete={handleLayoutAnimationComplete}
      transformTemplate={handleParentTransform}
      className={className}
      style={mergedContainerStyle}
    >
      <motion.div
        layout
        layoutId={`_${layoutId}_child`}
        layoutCrossfade={false}
        style={ANCHOR_LOCKED_STYLE}
      >
        {/* Descendants consume the post-compensation visual size, not the raw outer transform. */}
        <VisualSizeProvider visualH={visualH} visualW={visualW}>
          {children}
        </VisualSizeProvider>
      </motion.div>
    </motion.div>
  )
}

export { MotionStageContainer }
