// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import './index.css'

interface FeedCardProps {
  letter: string
  height: number
}

export function FeedCard(props: FeedCardProps) {
  const { letter, height = 422 } = props

  return (
    <view style={{ width: '100%', height: 'max-content' }}>
      <view className='feed-card' style={{ height: `${height}px` }}>
        <text className='feed-card__letter'>{letter}</text>
        <text className='feed-card__title'>FeedList</text>
        <text className='feed-card__subtitle'>@lynx-js/lynx-ui</text>
      </view>
    </view>
  )
}
