// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'

import './index.css'

function App() {
  return (
    <view style={{ height: '500px', width: '100%' }}>
      <ScrollView
        scrollviewId={'scrollview'}
        lazyOptions={{
          enableLazy: false,
        }}
        style={{ width: '100%', height: '500px' }}
        scrollOrientation='horizontal'
      >
        <view class='container'>
          <view style='flex-basis:auto;background-color:rgba(255,0,200,0.2);flex-grow:1'>
            <text>flex-basis:auto</text>
          </view>
          <view style='margin-left:5px;background-color:rgba(0,0,255,0.2);flex-grow:1'>
            <text>Item Two</text>
          </view>
          <view style='margin-left:5px;background-color:rgba(0,0,255,0.2);flex-grow:1'>
            <text>Item Three</text>
          </view>
          <view style='margin-left:5px;background-color:rgba(0,0,255,0.2);flex-grow:1'>
            <text>Item Four</text>
          </view>
          <view style='margin-left:5px;background-color:rgba(0,0,255,0.2);flex-grow:1'>
            <text>Item Five</text>
          </view>
        </view>
      </ScrollView>
    </view>
  )
}

root.render(<App />)

export default App
