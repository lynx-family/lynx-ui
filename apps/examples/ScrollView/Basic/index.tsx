// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'

import { CircleLetterItem } from './CircleLetterItem'
import './index.css'

function App() {
  const topLetters = [
    'L',
    'Y',
    'N',
    'X',
    'U',
    'I',
    'L',
    'Y',
    'N',
    'X',
    'J',
    'S',
  ]
  return (
    <view className='container lunaris-dark'>
      <ScrollView scrollOrientation='horizontal' className='scroll-view'>
        <view className='scroll-view-background'>
          {topLetters.map((l, idx) => (
            <view
              key={`circle-${idx}`}
              style={{ marginRight: '24px' }}
            >
              <CircleLetterItem letter={l} />
            </view>
          ))}
        </view>
      </ScrollView>
    </view>
  )
}

root.render(<App />)
