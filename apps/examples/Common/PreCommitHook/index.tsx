// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useMainThreadRef, useState } from '@lynx-js/react'
import './styles.css'

import { Button, usePreCommit } from '@lynx-js/lynx-ui'
import type { MainThread } from '@lynx-js/types'

function PreCommitBox() {
  const nodeMTRef = useMainThreadRef<MainThread.Element>(null)
  const textMTRef = useMainThreadRef<MainThread.Element>(null)
  const [boxStyle, setBoxStyle] = useState('')
  const [textStyle, setTextStyle] = useState('')

  /**
   * When update happens, state will be patched to main thread
   * This hook will run after the state is patched, but before its result is committed to Native
   * So it can be used to modify the element before it is committed to Native
   */
  usePreCommit(() => {
    'main thread'
    nodeMTRef.current?.setStyleProperties({
      'background-color': '#00D0F1',
    })
    textMTRef.current?.setStyleProperties({
      color: '#ffffff',
    })
  }, [])

  return (
    <view
      bindtap={() => {
        setBoxStyle('background-color: var(--primary);')
        setTextStyle('color: var(--primary-content);')
      }}
      main-thread:ref={nodeMTRef}
      style={boxStyle}
      className='box'
    >
      <text
        main-thread:ref={textMTRef}
        style={textStyle}
        className='box-text'
      >
        PreCommit
      </text>
    </view>
  )
}

function App() {
  const [revision, setRevision] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <PreCommitBox key={revision} />
      <text className='tap-hint'>Tap to restore original style</text>
      <view className='legend'>
        <view className='legend-item'>
          <view className='legend-swatch legend-swatch-original' />
          <text className='legend-label'>Original</text>
        </view>
        <view className='legend-item'>
          <view className='legend-swatch legend-swatch-pre-commit' />
          <text className='legend-label'>Pre-commit</text>
        </view>
      </view>
      <Button
        className='redo-button'
        onClick={() => setRevision((value) => value + 1)}
      >
        <text className='redo-button-label'>Redo mount</text>
      </Button>
    </view>
  )
}

root.render(<App />)
