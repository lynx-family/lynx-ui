// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Destination } from './data'

export function DestinationCard(
  { destination }: { destination: Destination },
) {
  return (
    <view
      className='card'
      accessibility-label={destination.title}
    >
      <text className='number'>
        {destination.number}
      </text>
      <view className='copy'>
        <text className='eyebrow'>
          {destination.eyebrow}
        </text>
        <text className='title'>
          {destination.title}
        </text>
      </view>
    </view>
  )
}
