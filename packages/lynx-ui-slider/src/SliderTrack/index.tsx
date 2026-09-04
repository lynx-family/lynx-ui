// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { memo } from '@lynx-js/react'

import { clsx } from 'clsx'

import { useSliderContext } from '../context'
import type { SliderTrackProps } from '../types'

export const SliderTrack = memo(function SliderTrack(props: SliderTrackProps) {
  const { active, disabled, trackRef, onTrackLayoutChange } = useSliderContext()
  const { children, className, style } = props

  return (
    <view
      ref={trackRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        overflow: 'visible',
        zIndex: 0,
      }}
      bindlayoutchange={onTrackLayoutChange}
    >
      <view
        className={clsx(className, {
          'ui-active': active,
          'ui-disabled': disabled,
        })}
        style={style}
      />
      {children}
    </view>
  )
})
