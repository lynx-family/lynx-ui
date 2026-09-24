// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Button } from '@lynx-js/lynx-ui'

import type { Story } from './data'

interface PageIndicatorsProps {
  activeIndex: number
  onSelect: (index: number) => void
  stories: readonly Story[]
}

export function PageIndicators(
  { activeIndex, onSelect, stories }: PageIndicatorsProps,
) {
  return (
    <view className='indicators'>
      {stories.map((story, index) => (
        <Button
          key={story.id}
          className={`indicator ${index === activeIndex ? 'active' : ''}`}
          onClick={() => onSelect(index)}
        >
          <view className='indicator-dot' />
        </Button>
      ))}
    </view>
  )
}
