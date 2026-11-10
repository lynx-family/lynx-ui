// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMemo } from '@lynx-js/react'

import { clsx } from 'clsx'

import { SheetPositionerContext } from '../context'
import type { SheetPositionerProps } from '../types'

/** Establish local layout and calculation bounds without querying native layout. */
export function SheetPositioner(props: SheetPositionerProps) {
  const { width, height, children, className, style, positionerProps } = props
  if (
    !Number.isFinite(width) || width <= 0
    || !Number.isFinite(height) || height <= 0
  ) {
    throw new Error('SheetPositioner width and height must be positive pixels')
  }
  const dimensions = useMemo(() => ({ width, height }), [width, height])

  return (
    <SheetPositionerContext.Provider value={dimensions}>
      <view
        {...positionerProps}
        className={clsx('lynx-ui-sheet__positioner', className)}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          ...style,
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'hidden',
        }}
        event-through={true}
      >
        {children}
      </view>
    </SheetPositionerContext.Provider>
  )
}
