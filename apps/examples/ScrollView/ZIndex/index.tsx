// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'

import './index.css'

const CARDS = [
  { key: 'card-1', title: 'Base Layer', badge: 'z-index: 1' },
  { key: 'card-2', title: 'Raised Layer', badge: 'z-index: 3' },
  { key: 'card-3', title: 'Normal Layer', badge: 'z-index: 1' },
  { key: 'card-4', title: 'Content Layer', badge: 'z-index: 1' },
]

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <ScrollView className='scroll-view'>
        <view className='scroll-view-content'>
          {CARDS.map((card, index) => (
            <view
              className={`layer-card ${
                index === 1 ? 'layer-card--raised' : ''
              }`}
              key={card.key}
            >
              <view
                className={`layer-card__badge ${
                  index === 1 ? 'layer-card__badge--raised' : ''
                }`}
              >
                <text className='layer-card__badge-text'>{card.badge}</text>
              </view>
              <text className='layer-card__title'>{card.title}</text>
              <text className='layer-card__subtitle'>
                Scroll the list and check the overlapping badge.
              </text>
            </view>
          ))}
        </view>
      </ScrollView>
    </view>
  )
}

root.render(<App />)

export default App
