// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useRef, useState } from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui-button'
import { invokeById } from '@lynx-js/lynx-ui-common'
import { LazyComponent } from '@lynx-js/lynx-ui-lazy-component'
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'

import './index.css'

const replayDelay = 1000

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
  const [replayToken, setReplayToken] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleReplay = () => {
    void invokeById('scrollview1', 'autoScroll', {
      rate: 3000,
      start: false,
    }).catch(() => {/* empty */})
    void invokeById('scrollview2', 'autoScroll', {
      rate: 3000,
      start: false,
    }).catch(() => {/* empty */})
    setReplayToken((token) => token + 1)
  }

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    void invokeById('scrollview1', 'scrollTo', {
      index: 0,
      offset: 0,
      smooth: false,
    }).catch(() => {/* empty */})
    void invokeById('scrollview2', 'scrollTo', {
      index: 0,
      offset: 0,
      smooth: false,
    }).catch(() => {/* empty */})

    timerRef.current = setTimeout(() => {
      void invokeById('scrollview1', 'autoScroll', {
        rate: 3000,
        start: true,
      }).catch(() => {/* empty */})
      void invokeById('scrollview2', 'autoScroll', {
        rate: 3000,
        start: true,
      }).catch(() => {/* empty */})
    }, replayDelay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [replayToken])

  return (
    <view className='container lunaris-dark luna-gradient-berry'>
      <view className='canvas'>
        <view className='toolbar'>
          <Button className='restart-button' onClick={handleReplay}>
            <text className='restart-button-text'>Restart</text>
          </Button>
        </view>

        <text className='description'>
          Compare LazyComponent visibility margin: the right column uses
          `bottom=200px`, so items mount up to 200px before entering the
          viewport.
        </text>

        <view className='columns'>
          {/* Left */}
          <view className='column'>
            <view className='info'>
              <text>bottom: 0px (mount when visible)</text>
            </view>

            <ScrollView
              scrollviewId='scrollview1'
              scrollOrientation='vertical'
              lazyOptions={{ enableLazy: false }}
              className='scrollview'
            >
              {Array.from({ length: 30 }).map((_, index) => (
                <LazyComponent
                  key={`${replayToken}-${index}`}
                  scene={`scene_1_${replayToken}`}
                  pid={`pid_${replayToken}_${index}`}
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
            <view className='info'>
              <text>bottom: 200px (preload before visible)</text>
            </view>

            <ScrollView
              scrollviewId='scrollview2'
              scrollOrientation='vertical'
              lazyOptions={{ enableLazy: false }}
              className='scrollview'
            >
              {Array.from({ length: 30 }).map((_, index) => (
                <LazyComponent
                  key={`${replayToken}-${index}`}
                  scene={`scene_2_${replayToken}`}
                  pid={`pid_${replayToken}_${index}`}
                  bottom='200px'
                  estimatedStyle={{ width: '100%', height: '300px' }}
                >
                  <Item />
                </LazyComponent>
              ))}
            </ScrollView>
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
