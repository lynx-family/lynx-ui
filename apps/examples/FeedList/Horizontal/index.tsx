// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { FeedList } from '@lynx-js/lynx-ui'

import { BounceTag } from '../shared/BounceTag'
import { FeedCardHorizontal } from '../shared/FeedCardHorizontal'

import './index.css'

const ITEMS = ['H', 'O', 'R', 'I', 'Z', 'O', 'N', 'T', 'A', 'L']

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <view className='demo-list-region'>
        <FeedList
          className='feed-list'
          style={{ width: '100%', height: '100%' }}
          listId='feedListHorizontal'
          listType='single'
          spanCount={1}
          scrollOrientation='horizontal'
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
                  title='FeedList Horizontal'
                  subtitle='direction: ltr + useBounce'
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
