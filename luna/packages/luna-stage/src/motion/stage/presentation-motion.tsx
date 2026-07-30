// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { AnimatePresence } from 'motion/react'
import type { MotionStyle } from 'motion/react'
import * as motion from 'motion/react-client'
import type { JSX } from 'react'

import type { MotionPresentationProps } from './types'

const PRESENTATION_LOCKED_STYLE: MotionStyle = {
  position: 'relative',
  width: 4,
  height: 4,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'visible',
  transformOrigin: 'center',
}

/**
 * Presentation-only motion wrapper.
 *
 * `AnimatePresence` with `propagate` ensures descendant `exit` animations still
 * run when this subtree is removed by an outer presence boundary.
 *
 * This layer intentionally sets `layout={false}` because layout measurement and
 * layout transitions are owned by `MotionStageContainer`. In other words,
 * `MotionStageContainer` moves/resizes the stage in layout space, while
 * `MotionPresentation` only handles presence-style visual animation for the
 * content inside that stage.
 */
function MotionPresentation(props: MotionPresentationProps): JSX.Element {
  const { children, className, style, ...restProps } = props

  const mergedStyle: MotionStyle = style === undefined
    ? PRESENTATION_LOCKED_STYLE
    : { ...(style as MotionStyle), ...PRESENTATION_LOCKED_STYLE }

  return (
    <AnimatePresence propagate>
      <motion.div
        layout={false}
        className={className}
        style={mergedStyle}
        {...restProps}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export { MotionPresentation }
