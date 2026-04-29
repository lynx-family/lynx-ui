// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { memo } from '@lynx-js/react'

import { useSliderContext } from '../context'
import type { SliderIndicatorProps } from '../types'

export const SliderIndicator = memo(function SliderIndicator(
  props: SliderIndicatorProps,
) {
  const { indicatorRef, currentValue, enableRTL } = useSliderContext()
  const { className, style } = props

  return (
    <view
      ref={indicatorRef}
      style={{
        position: 'absolute',
        top: '0px',
        bottom: '0px',
        overflow: 'visible',
        ...(enableRTL ? { right: '0px' } : { left: '0px' }),
        width: `${currentValue.current * 100}%`,
      }}
    >
      <view className={className} style={style} />
    </view>
  )
})
