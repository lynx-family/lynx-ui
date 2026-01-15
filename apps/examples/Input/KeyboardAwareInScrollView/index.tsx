// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root } from '@lynx-js/react'

import {
  Input,
  KeyboardAwareResponder,
  KeyboardAwareRoot,
  KeyboardAwareTrigger,
  TextArea,
} from '@lynx-js/lynx-ui-input'

import './index.css'

function App() {
  type Item = 'block' | 'input' | 'textarea'

  const contentArray: Item[] = [
    'block',
    'input',
    'block',
    'input',
    'block',
    'input',
    'block',
    'input',
    'block',
    'input',
    'block',
    'textarea',
    'block',
    'input',
    'block',
  ]

  return (
    <view className='container lunaris-dark'>
      <KeyboardAwareRoot androidStatusBarPlusBottomBarHeight={74}>
        <KeyboardAwareResponder as='ScrollView' className='scroll'>
          {contentArray.map((item, index) => {
            if (item === 'input') {
              return (
                <KeyboardAwareTrigger key={`input-${index}`} offset={0}>
                  <view className='card'>
                    <text className='label'>Input</text>
                    <Input className='input' placeholder='Type here' />
                  </view>
                </KeyboardAwareTrigger>
              )
            }

            if (item === 'textarea') {
              return (
                <KeyboardAwareTrigger key={`textarea-${index}`} offset={0}>
                  <view className='card'>
                    <text className='label'>TextArea</text>
                    <view className='textarea-wrap'>
                      <TextArea
                        className='textarea'
                        placeholder='Write something...'
                      />
                    </view>
                  </view>
                </KeyboardAwareTrigger>
              )
            }

            return <view key={`block-${index}`} className='block' />
          })}
        </KeyboardAwareResponder>
      </KeyboardAwareRoot>
    </view>
  )
}

root.render(<App />)

export default App
