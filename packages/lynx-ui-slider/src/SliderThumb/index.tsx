// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { memo } from '@lynx-js/react'

import { clsx } from 'clsx'

import { useSliderContext } from '../context'
import type { SliderThumbProps } from '../types'
import { getSliderThumbValue, getVisualRatio } from '../utils'

export const SliderThumb = memo(function SliderThumb(props: SliderThumbProps) {
  const {
    thumbRefs,
    active,
    activeThumbIndex,
    currentValue,
    disabled,
    enableRTL,
    onThumbInteractionStart,
  } = useSliderContext()
  const { children, className, index = 0, style } = props
  const value = getSliderThumbValue(currentValue.current, index)

  return (
    <view
      ref={thumbRefs[index]}
      style={{
        position: 'absolute',
        top: '50%',
        left: `${getVisualRatio(value, enableRTL) * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
      }}
      bindmousedown={() => {
        onThumbInteractionStart(index)
      }}
      bindtouchstart={() => {
        onThumbInteractionStart(index)
      }}
    >
      <view
        className={clsx(className, {
          'ui-active': active && activeThumbIndex === index,
          'ui-disabled': disabled,
        })}
        style={style}
      >
        {children}
      </view>
    </view>
  )
})
