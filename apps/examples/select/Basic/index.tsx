// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Select } from '@lynx-js/lynx-ui'

import './index.css'

const options = [
  { label: 'Apple', value: 'apple' },
  { label: 'Orange', value: 'orange' },
  { label: 'Banana', value: 'banana', disabled: true },
]

function App() {
  const [value, setValue] = useState('apple')

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas'>
        <text className='eyebrow'>
          Forms
        </text>
        <text className='title'>
          Select example
        </text>
        <text className='desc'>
          Tap an option to switch the value
        </text>
        <Select
          value={value}
          onValueChange={setValue}
          options={options}
          className='select-root'
          optionClassName='select-option'
        />
        <text className='value'>
          Selected: {value}
        </text>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
