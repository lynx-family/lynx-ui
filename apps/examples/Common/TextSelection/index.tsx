// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import './index.css'

function App() {
  return (
    <view className='demo-container luna-light'>
      <view className='demo-canvas'>
        <text className='hint'>
          长按下方文字，再拖动选区手柄。
        </text>

        <view className='sample'>
          <text className='label'>默认选区</text>
          <text
            className='selectable'
            text-selection={true}
            flatten={false}
          >
            Hello world. 选中这段文字，观察高亮背景和两端的拖拽手柄。
          </text>
        </view>

        <view className='sample'>
          <text className='label'>黄色背景 · 蓝色手柄 · 12px</text>
          <text
            className='selectable custom-selection'
            text-selection={true}
            flatten={false}
          >
            Hello world. 选中这段文字，观察高亮背景和两端的拖拽手柄。
          </text>
        </view>

        <view className='sample'>
          <text className='label'>黄色背景 · 蓝色手柄 · 24px</text>
          <text
            className='selectable custom-selection large-handles'
            text-selection={true}
            flatten={false}
          >
            Hello world. 选中这段文字，观察高亮背景和两端的拖拽手柄。
          </text>
        </view>

        <text className='hint'>Android / iOS · Lynx SDK 3.2+</text>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
