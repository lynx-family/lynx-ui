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
          第五档生效时，中间一行应与固定 48px 的参照一样大。
        </text>

        <view className='sample'>
          <text className='label'>3 个预设 · 6 / 8 / 10px</text>
          <text className='sample-text three-presets' flatten={false}>
            LYNX
          </text>
        </view>

        <view className='sample'>
          <text className='label'>5 个预设 · 6 / 8 / 10 / 12 / 48px</text>
          <text className='sample-text five-presets' flatten={false}>
            LYNX
          </text>
        </view>

        <view className='sample'>
          <text className='label'>固定 48px · 视觉参照</text>
          <text className='sample-text fixed-size' flatten={false}>
            LYNX
          </text>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
