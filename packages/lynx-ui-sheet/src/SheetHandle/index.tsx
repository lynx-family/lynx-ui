// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { useSheetDragContext } from '../context'
import type { SheetHandleProps } from '../types'

export function SheetHandle(props: SheetHandleProps) {
  const { className, style, children, ...rest } = props
  const { dragHandlers } = useSheetDragContext()

  return (
    <view
      className={className}
      style={style}
      {...rest}
      main-thread:bindtouchstart={dragHandlers.handleTouchStartMT}
      main-thread:bindtouchmove={dragHandlers.handleTouchMoveMT}
      main-thread:bindtouchend={dragHandlers.handleTouchEndMT}
    >
      {children}
    </view>
  )
}
