// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'

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
    <view className='demo-container lunaris-dark'>
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
            <view className='card' key={`${letter}-${index}`}>
              <view className='circle'>
                <text className='letter'>{letter}</text>
                <text className='title'>ScrollView Horizontal</text>
                <text className='subtitle'>direction: ltr + useBounce</text>
              </view>
            </view>
          ))}
        </view>
      </ScrollView>
    </view>
  )
}

root.render(<App />)

export default App
