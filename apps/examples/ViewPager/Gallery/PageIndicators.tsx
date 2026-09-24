// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Destination } from './data'

interface PageIndicatorsProps {
  activeIndex: number
  destinations: readonly Destination[]
}

export function PageIndicators(
  { activeIndex, destinations }: PageIndicatorsProps,
) {
  return (
    <view className='indicators'>
      {destinations.map((destination, index) => (
        <view
          key={destination.id}
          className={`indicator ${index === activeIndex ? 'active' : ''}`}
        />
      ))}
    </view>
  )
}
