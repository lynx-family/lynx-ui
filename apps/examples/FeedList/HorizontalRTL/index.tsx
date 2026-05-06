// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { FeedList } from '@lynx-js/lynx-ui'

import './index.css'

const ITEMS = ['F', 'E', 'E', 'D', 'L', 'I', 'S', 'T', 'R', 'T', 'L']

function BounceTag(props: { label: string, variant: 'upper' | 'lower' }) {
  const { label, variant } = props
  const lines = label.split(' ')

  return (
    <view className='bounce-slot'>
      <view className={`bounce-slot__text bounce-slot__text--${variant}`}>
        {lines.map((line, index) => (
          <text className='bounce-slot__line' key={`${line}-${index}`}>
            {line}
          </text>
        ))}
      </view>
    </view>
  )
}

function App() {
  return (
    <view className='demo-container lunaris-dark rtl-scope'>
      <FeedList
        className='feed-list'
        style={{ width: '100%', height: '520px' }}
        listId='feedListHorizontalRTL'
        listType='single'
        spanCount={1}
        scrollOrientation='horizontal'
        enableRTL={true}
        useRefactorList={true}
        bounceableOptions={{
          enableBounces: true,
          alwaysBouncing: true,
          upperBounceItem: <BounceTag label='Start Bounce' variant='upper' />,
          lowerBounceItem: <BounceTag label='End Bounce' variant='lower' />,
        }}
      >
        <list-item item-key='feed-start-gap'>
          <view className='edge-gap' />
        </list-item>
        {ITEMS.map((letter, index) => (
          <list-item item-key={`card-${index}`} key={`card-${index}`}>
            <view className='card-shell'>
              <view className='rectangle-card'>
                <text className='rectangle-card__letter'>{letter}</text>
                <text className='rectangle-card__title'>FeedList RTL</text>
                <text className='rectangle-card__subtitle'>
                  direction: rtl + useBounce
                </text>
              </view>
            </view>
          </list-item>
        ))}
        <list-item item-key='feed-end-gap'>
          <view className='edge-gap' />
        </list-item>
      </FeedList>
    </view>
  )
}

root.render(<App />)

export default App
