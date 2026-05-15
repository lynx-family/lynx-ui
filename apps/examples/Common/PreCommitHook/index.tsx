// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useMainThreadRef, useState } from '@lynx-js/react'
import './styles.css'

import { usePreCommit } from '@lynx-js/lynx-ui'
import type { MainThread } from '@lynx-js/types'

function App() {
  const nodeMTRef = useMainThreadRef<MainThread.Element>(null)
  const [boxStyle, setBoxStyle] = useState('')

  /**
   * When update happens, state will be patched to main thread
   * This hook will run after the state is patched, but before its result is committed to Native
   * So it can be used to modify the element before it is committed to Native
   */
  usePreCommit(() => {
    'main thread'
    nodeMTRef.current?.setStyleProperties({
      'background-color': '#ff5a7a',
    })
  }, [])

  return (
    <view className='demo-container lunaris-dark'>
      <view
        bindtap={() => {
          setBoxStyle('background-color: var(--primary);')
        }}
        main-thread:ref={nodeMTRef}
        style={boxStyle}
        className='box'
      >
        <text className='box-text'>PreCommit</text>
      </view>
    </view>
  )
}

root.render(<App />)
