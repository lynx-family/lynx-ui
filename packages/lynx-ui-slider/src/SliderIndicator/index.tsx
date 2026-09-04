// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { memo } from '@lynx-js/react'

import { clsx } from 'clsx'

import { useSliderContext } from '../context'
import type { SliderIndicatorProps } from '../types'
import { getSliderIndicatorGeometry } from '../utils'

export const SliderIndicator = memo(function SliderIndicator(
  props: SliderIndicatorProps,
) {
  const { active, currentValue, disabled, enableRTL, indicatorRef } =
    useSliderContext()
  const { className, style } = props
  const { offset, size } = getSliderIndicatorGeometry(currentValue.current)

  return (
    <view
      ref={indicatorRef}
      style={{
        position: 'absolute',
        top: '0px',
        bottom: '0px',
        overflow: 'visible',
        ...(enableRTL
          ? { right: `${offset * 100}%` }
          : { left: `${offset * 100}%` }),
        width: `${size * 100}%`,
      }}
    >
      <view
        className={clsx(className, {
          'ui-active': active,
          'ui-disabled': disabled,
        })}
        style={style}
      />
    </view>
  )
})
