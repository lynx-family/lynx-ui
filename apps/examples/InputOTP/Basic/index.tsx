// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { InputOTP, InputOTPSlot } from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  const [value, setValue] = useState('')

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-card'>
        <text className='eyebrow'>Account security</text>
        <text className='title'>Enter the 6-character code</text>
        <text className='description'>
          We sent a verification code to your trusted device.
        </text>

        <InputOTP
          autoFocus
          className='otp-field'
          length={6}
          value={value}
          onChange={setValue}
          onComplete={(code) => {
            console.log('Verification code complete:', code)
          }}
        >
          {Array.from({ length: 6 }, (_, index) => (
            <InputOTPSlot
              key={index}
              className='otp-slot'
              index={index}
            />
          ))}
        </InputOTP>

        <text className='status'>
          {value.length === 6
            ? 'Code ready to verify'
            : `${6 - value.length} characters remaining`}
        </text>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
