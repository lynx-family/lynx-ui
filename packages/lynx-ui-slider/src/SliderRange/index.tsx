// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { memo } from '@lynx-js/react'

import { useSliderContext } from '../context'
import type { SliderRangeProps } from '../types'

export const SliderRange = memo(function SliderRange(props: SliderRangeProps) {
  const { valueRef, currentValue, enableRTL } = useSliderContext()
  const { children, className, style } = props

  return (
    <view
      ref={valueRef}
      style={{
        position: 'absolute',
        top: '0px',
        ...(enableRTL ? { right: '0px' } : { left: '0px' }),
        height: '100%',
        overflow: 'visible',
        width: `${currentValue.current * 100}%`,
      }}
    >
      <view className={className} style={style} />
      {children}
    </view>
  )
})
