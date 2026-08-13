// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { FeedList } from '@lynx-js/lynx-ui'

import { BounceTag } from '../shared/BounceTag'
import { FeedCardHorizontal } from '../shared/FeedCardHorizontal'

import './index.css'

const ITEMS = ['F', 'E', 'E', 'D', 'L', 'I', 'S', 'T', 'R', 'T', 'L']

function App() {
  return (
    <view className='demo-container lunaris-dark rtl-scope'>
      <view className='demo-list-region'>
        <FeedList
          className='feed-list'
          style={{ width: '100%', height: '100%' }}
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
                <FeedCardHorizontal
                  letter={letter}
                  title='FeedList RTL'
                  subtitle='direction: rtl + useBounce'
                />
              </view>
            </list-item>
          ))}
          <list-item item-key='feed-end-gap'>
            <view className='edge-gap' />
          </list-item>
        </FeedList>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
