// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { useState } from '@lynx-js/react'

import { OverlayView } from '@lynx-js/lynx-ui-overlay'

import { SheetViewportContext, useSheetContext } from '../context'
import type { SheetViewportSize } from '../context'
import type { SheetViewProps } from '../types'

interface ViewportLayoutSize {
  height?: number
  width?: number
}

interface ViewportLayoutEvent {
  detail?: ViewportLayoutSize
  params?: ViewportLayoutSize
}

export const SheetView = (props: SheetViewProps) => {
  const {
    container,
    children,
    className,
    style,
    overlayLevel,
    nativeProps,
  } = props

  const { mounted, forceMount, enableRTL } = useSheetContext()
  const [viewport, setViewport] = useState<SheetViewportSize>({})

  const handleViewportLayout = (event: ViewportLayoutEvent) => {
    const height = event.detail?.height ?? event.params?.height
    const width = event.detail?.width ?? event.params?.width
    const nextHeight = typeof height === 'number' && height > 0
      ? height
      : undefined
    const nextWidth = typeof width === 'number' && width > 0
      ? width
      : undefined
    if (nextHeight === undefined && nextWidth === undefined) {
      return
    }

    setViewport((current) => {
      const resolvedHeight = nextHeight ?? current.height
      const resolvedWidth = nextWidth ?? current.width
      if (
        current.height === resolvedHeight
        && current.width === resolvedWidth
      ) {
        return current
      }
      return { height: resolvedHeight, width: resolvedWidth }
    })
  }

  if (!mounted && !forceMount) {
    return null
  }

  return (
    <SheetViewportContext.Provider value={viewport}>
      <OverlayView
        container={container}
        className={className}
        style={{
          direction: enableRTL ? 'rtl' : 'ltr',
          ...style,
          position: container ? 'relative' : 'fixed',
        }}
        overlayLevel={overlayLevel}
        overlayViewProps={nativeProps}
      >
        <view
          flatten={false}
          event-through={true}
          user-interaction-enabled={false}
          style={{
            position: 'absolute',
            top: '0px',
            left: '0px',
            width: '100%',
            height: '100%',
          }}
          bindlayoutchange={handleViewportLayout}
        />
        {children}
      </OverlayView>
    </SheetViewportContext.Provider>
  )
}
