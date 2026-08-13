// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import './index.css'

import { clsx } from 'clsx'

interface CircleCardProps {
  letter: string
  title: string
  subtitle: string
  subtitleDirection?: 'inherit' | 'ltr'
}

export function CircleCard(props: CircleCardProps) {
  const { letter, title, subtitle, subtitleDirection = 'inherit' } = props

  return (
    <view className='card'>
      <view className='circle'>
        <text className='letter'>{letter}</text>
        <text className='title'>{title}</text>
        <text
          className={clsx(
            'subtitle',
            subtitleDirection === 'ltr' && 'subtitle--ltr',
          )}
        >
          {subtitle}
        </text>
      </view>
    </view>
  )
}
