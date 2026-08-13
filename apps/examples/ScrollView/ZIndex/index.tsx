// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

import { CARDS } from './data'
import './index.css'

function App() {
  return (
    <view className='demo-container lunaris-dark luna-gradient-rose'>
      <ScrollView className='scroll-view'>
        <view className='scroll-view-content'>
          {CARDS.map((card) => (
            <view
              className={clsx(
                'layer-card',
                card.surfaceClassName,
                card.raised && 'layer-card--raised',
              )}
              key={card.key}
            >
              <view
                className={clsx(
                  'layer-card__badge',
                  card.raised && 'layer-card__badge--raised',
                )}
              >
                <text className='layer-card__badge-text'>{card.badge}</text>
              </view>
              <text className='layer-card__title'>{card.title}</text>
              <text className='layer-card__subtitle'>
                {card.subtitle}
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
