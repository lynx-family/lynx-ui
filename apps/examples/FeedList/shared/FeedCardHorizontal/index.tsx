// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import './index.css'

interface FeedCardHorizontalProps {
  letter: string
  title: string
  subtitle: string
}

export function FeedCardHorizontal(props: FeedCardHorizontalProps) {
  const { letter, title, subtitle } = props

  return (
    <view className='feed-card-horizontal'>
      <text className='feed-card-horizontal__letter'>{letter}</text>
      <text className='feed-card-horizontal__title'>{title}</text>
      <text className='feed-card-horizontal__subtitle'>{subtitle}</text>
    </view>
  )
}
