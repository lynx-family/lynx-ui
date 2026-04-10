// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { memo } from '@lynx-js/react'

import type { SliderThumbProps } from '../types'

export const SliderThumb = memo(function SliderThumb(props: SliderThumbProps) {
  const {
    children,
    className,
    style,
  } = props

  return (
    children
      ? (
        <view className={className} style={style}>
          {children}
        </view>
      )
      : null
  )
})
