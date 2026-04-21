// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { memo } from '@lynx-js/react'

import { useSliderContext } from '../context'
import type { SliderThumbProps } from '../types'
import { getVisualRatio } from '../utils'

export const SliderThumb = memo(function SliderThumb(props: SliderThumbProps) {
  const { thumbRef, currentValue, enableRTL } = useSliderContext()
  const { children, className, style } = props

  return (
    <view
      ref={thumbRef}
      style={{
        position: 'absolute',
        top: '50%',
        left: `${getVisualRatio(currentValue.current, enableRTL) * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
      }}
    >
      <view className={className} style={style}>
        {children}
      </view>
    </view>
  )
})
