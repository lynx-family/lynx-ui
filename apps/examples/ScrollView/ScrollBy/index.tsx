// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui'

import './index.css'

const ITEMS = Array.from({ length: 24 }, (_, index) => index + 1)

function scrollByOffset(offset: number) {
  'main thread'
  lynx.querySelector('#scrollByDemoView')?.invoke('scrollBy', {
    offset,
  })
}

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <view className='toolbar'>
        <Button
          className='button'
          buttonProps={{
            'main-thread:bindtap': () => {
              'main thread'
              scrollByOffset(-160)
            },
          }}
        >
          <text className='button-text'>Scroll Up</text>
        </Button>
        <Button
          className='button button--primary'
          buttonProps={{
            'main-thread:bindtap': () => {
              'main thread'
              scrollByOffset(160)
            },
          }}
        >
          <text className='button-text'>Scroll Down</text>
        </Button>
      </view>

      <scroll-view
        id='scrollByDemoView'
        className='scroll-view'
        scroll-orientation='vertical'
        enable-scroll={false}
      >
        <view className='scroll-view-content'>
          {ITEMS.map(item => (
            <view className='card' key={`scroll-by-card-${item}`}>
              <text className='card-title'>{`Item ${item}`}</text>
              <text className='card-subtitle'>scrollBy target content</text>
            </view>
          ))}
        </view>
      </scroll-view>
    </view>
  )
}

root.render(<App />)

export default App
