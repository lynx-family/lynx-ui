// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
// cspell:disable

import { root } from '@lynx-js/react'

import { InputOTP, InputOTPSlot } from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  return (
    <view className='demo-container rtl lunaris-dark'>
      <view className='demo-card'>
        <text className='title'>أدخل رمز التحقق</text>
        <text className='description'>
          يرث الحقل اتجاه الصفحة من الحاوية الخارجية.
        </text>

        <InputOTP
          className='otp-field'
          defaultValue='6174'
          length={4}
        >
          {Array.from({ length: 4 }, (_, index) => (
            <InputOTPSlot
              key={index}
              className='otp-slot'
              index={index}
            />
          ))}
        </InputOTP>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
