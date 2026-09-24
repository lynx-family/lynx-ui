// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { DynamicHeightPage } from './data'

interface HeightCardProps {
  index: number
  page: DynamicHeightPage
}

export function HeightCard({ index, page }: HeightCardProps) {
  return (
    <view
      className='card'
      style={{ height: `${page.height}px` }}
    >
      <text className='number'>
        0{index + 1}
      </text>
      <text className='height'>
        {page.height}px
      </text>
    </view>
  )
}
