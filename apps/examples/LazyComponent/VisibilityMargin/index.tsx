// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect } from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui-button'
import { invokeById } from '@lynx-js/lynx-ui-common'
import { LazyComponent } from '@lynx-js/lynx-ui-lazy-component'
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'

import './index.css'

function Item() {
  return (
    <view className='item'>
      <text className='item-text'>Item</text>
      {Array.from({ length: 6 }).map((_, index) => (
        <view className='item-sub-block' key={index} />
      ))}
    </view>
  )
}

function App() {
  useEffect(() => {
    setTimeout(() => {
      void invokeById('scrollview1', 'autoScroll', {
        rate: 3000,
        start: true,
      })

      void invokeById('scrollview2', 'autoScroll', {
        rate: 3000,
        start: true,
      })
    }, 1000)
  }, [])

  return (
    <view className='container lunaris-dark'>
      {/* Left */}
      <view className='column'>
        <Button className='header-button'>
          <text>
            exposure-margin-bottom: 0px
          </text>
        </Button>

        <ScrollView
          scrollviewId='scrollview1'
          scrollOrientation='vertical'
          lazyOptions={{ enableLazy: false }}
          className='scrollview'
        >
          {Array.from({ length: 30 }).map((_, index) => (
            <LazyComponent
              key={index}
              scene='scene_1'
              pid={`pid_${index}`}
              bottom='0px'
              estimatedStyle={{ width: '100%', height: '300px' }}
            >
              <Item />
            </LazyComponent>
          ))}
        </ScrollView>
      </view>

      {/* Right */}
      <view className='column'>
        <Button className='header-button'>
          <text>
            exposure-margin-bottom: 200px
          </text>
        </Button>

        <ScrollView
          scrollviewId='scrollview2'
          scrollOrientation='vertical'
          lazyOptions={{ enableLazy: false }}
          className='scrollview'
        >
          {Array.from({ length: 30 }).map((_, index) => (
            <LazyComponent
              key={index}
              scene='scene_2'
              pid={`pid_${index}`}
              bottom='200px'
              estimatedStyle={{ width: '100%', height: '300px' }}
            >
              <Item />
            </LazyComponent>
          ))}
        </ScrollView>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
