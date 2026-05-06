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
  'R',
  'T',
  'L',
  'B',
  'O',
  'U',
  'N',
  'C',
  'E',
]

function BounceTag(props: { label: string }) {
  const { label } = props
  const lines = label.split(' ')

  return (
    <view className='bounce-slot'>
      <view className='bounce-slot__text'>
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
      <ScrollView
        scrollOrientation='horizontal'
        enableRTL={true}
        className='scroll-view'
        bounceableOptions={{
          enableBounces: true,
          alwaysBouncing: true,
          upperBounceItem: <BounceTag label='Start Bounce' />,
          lowerBounceItem: <BounceTag label='End Bounce' />,
        }}
      >
        <view className='scroll-view-content'>
          {LETTERS.map((letter, index) => (
            <view className='card' key={`${letter}-${index}`}>
              <view className='circle'>
                <text className='letter'>{letter}</text>
                <text className='title'>ScrollView RTL</text>
                <text className='subtitle'>direction: rtl + useBounce</text>
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
