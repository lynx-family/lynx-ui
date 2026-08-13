// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'

import { BounceTag } from '../shared/BounceTag'
import { CircleCard } from '../shared/CircleCard'
import './index.css'

const LETTERS = [
  'L',
  'Y',
  'N',
  'X',
  'L',
  'T',
  'R',
  'B',
  'O',
  'U',
  'N',
  'C',
  'E',
]

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <view className='demo-scroll-region'>
        <ScrollView
          scrollOrientation='horizontal'
          className='scroll-view'
          bounceableOptions={{
            enableBounces: true,
            alwaysBouncing: true,
            upperBounceItem: <BounceTag label='Start Bounce' variant='upper' />,
            lowerBounceItem: <BounceTag label='End Bounce' variant='lower' />,
          }}
        >
          <view className='scroll-view-content'>
            {LETTERS.map((letter, index) => (
              <CircleCard
                letter={letter}
                title='ScrollView Bounces'
                subtitle='@lynx-js/lynx-ui'
                key={`${letter}-${index}`}
              />
            ))}
          </view>
        </ScrollView>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
