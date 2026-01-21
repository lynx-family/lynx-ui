// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import './index.css'

interface FlexItemCardProps {
  letter?: string
  variant?: 'fixed' | 'auto'
}

export const FlexItemCard = (props: FlexItemCardProps): ReactNode => {
  const { letter, variant = 'fixed' } = props

  return (
    <view className={variant === 'auto' ? 'card auto' : 'card'}>
      <view className='card-content'>
        {variant === 'auto'
          ? (
            <>
              <text className='auto-title'>Flex Basis:</text>
              <text className='auto-title'>Auto</text>
            </>
          )
          : <text className='letter'>{letter}</text>}
        <text className='title'>ScrollView</text>
        <text className='subtitle'>@lynx-js/lynx-ui</text>
      </view>
    </view>
  )
}
