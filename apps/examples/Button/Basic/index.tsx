// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

import { Heart } from '../shared/Heart'

import './index.css'

function App() {
  return (
    <view className='demo-container lunaris-dark luna-gradient-rose'>
      <view className='demo-canvas'>
        {/* Usage 1: render props to read `active` state and toggle `.active` for styling */}
        <Button onClick={() => console.info('clicked')} className='button-root'>
          {({ active = false }) => (
            <view className={clsx('button', { 'active': active })}>
              <text className='button-text'>
                Button
              </text>
            </view>
          )}
        </Button>
        {/* Usage 2: regular children; styles rely on the primitives-injected `ui-active` state class */}
        <Button className='button'>
          <Heart />
          <text className='button-text'>
            Button
          </text>
        </Button>
      </view>
    </view>
  )
}
root.render(<App />)
export default App
