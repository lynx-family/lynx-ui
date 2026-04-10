// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { memo } from '@lynx-js/react'

import type { SliderTrackProps } from '../types'

export const SliderTrack = memo(function SliderTrack(props: SliderTrackProps) {
  const { className, style } = props

  return <view className={className} style={style} />
})
