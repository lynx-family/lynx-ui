// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui-button'
import { LazyComponent } from '@lynx-js/lynx-ui-lazy-component'

import './index.css'

function Item() {
  return (
    <view
      native-interaction-enabled={false}
      user-interaction-enabled={false}
      className='lazy-item'
    >
      {Array.from({ length: 500 }).map((_, index) => (
        <view
          key={index}
          flatten={false}
          className='lazy-item-cell'
        />
      ))}
    </view>
  )
}

function App() {
  const [lazyVisible, setLazyVisible] = useState<boolean>(false)
  const [nonLazyVisible, setNonLazyVisible] = useState<boolean>(false)

  return (
    <view className='container lunaris-dark'>
      <view className='panel'>
        <Button
          className='button'
          onClick={() => {
            setLazyVisible((v) => !v)
          }}
        >
          <text className='button-text'>Lazy</text>
        </Button>

        {lazyVisible && (
          <view className='preview'>
            <LazyComponent
              scene='scene'
              pid='pid'
              estimatedStyle={{ width: '1px', height: '1px' }}
            >
              <Item />
            </LazyComponent>
          </view>
        )}
      </view>

      <view className='panel'>
        <Button
          className='button'
          onClick={() => {
            setNonLazyVisible((v) => !v)
          }}
        >
          <text className='button-text'>Non-lazy</text>
        </Button>

        {nonLazyVisible && (
          <view className='preview'>
            <Item />
          </view>
        )}
      </view>
    </view>
  )
}

root.render(<App />)

export default App
