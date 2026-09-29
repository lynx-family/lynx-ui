// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  InputOTP,
  InputOTPSlot,
  KeyboardAwareResponder,
  KeyboardAwareRoot,
  KeyboardAwareTrigger,
} from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  const [value, setValue] = useState('')

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <KeyboardAwareRoot androidStatusBarPlusBottomBarHeight={74}>
        <KeyboardAwareResponder className='responder'>
          <view className='spacer' />

          <view className='intro'>
            <text className='eyebrow'>Keyboard avoidance</text>
            <text className='title'>Confirm your identity</text>
            <text className='description'>
              Tap the code field near the bottom. The focused field stays above
              the software keyboard as the page moves.
            </text>
          </view>

          <KeyboardAwareTrigger offset={0}>
            <view className='card'>
              <text className='label'>Verification code</text>
              <text className='hint'>Enter the 6-digit code</text>

              <InputOTP
                className='otp-field'
                length={6}
                value={value}
                onChange={setValue}
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
                  ? 'Code complete'
                  : `${6 - value.length} digits remaining`}
              </text>
            </view>
          </KeyboardAwareTrigger>
        </KeyboardAwareResponder>
      </KeyboardAwareRoot>
    </view>
  )
}

root.render(<App />)

export default App
