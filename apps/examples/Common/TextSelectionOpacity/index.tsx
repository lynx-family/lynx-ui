// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ScrollView } from '@lynx-js/lynx-ui'

import { opacityCases } from './data'
import './index.css'

function App() {
  return (
    <view className='demo-container luna-light'>
      <text className='hint'>
        长按选中文字，向下滚动比较黄色选区的透明度。
      </text>
      <ScrollView className='scroll-view'>
        <view className='scroll-content'>
          <view className='sample'>
            <text className='label'>默认选区 · 对照</text>
            <text
              className='selectable'
              text-selection={true}
              flatten={false}
            >
              Hello world，选中文字观察遮挡。
            </text>
          </view>

          {opacityCases.map(({ alpha, className }) => (
            <view className='sample' key={alpha}>
              <text className='label'>{`alpha = ${alpha}`}</text>
              <text
                className={`selectable custom-selection ${className}`}
                text-selection={true}
                flatten={false}
              >
                Hello world，选中文字观察遮挡。
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
