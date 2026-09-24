// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { PresentationPage } from './data'

export function PresentationCard({ page }: { page: PresentationPage }) {
  return (
    <view
      className='card'
      style={{ height: `${page.cardHeight}px` }}
    >
      <text className='letter'>
        {page.letter}
      </text>
      <view className='caption'>
        <text className='caption-title'>ViewPager</text>
        <text className='caption-meta'>@lynx-js/lynx-ui</text>
      </view>
    </view>
  )
}
