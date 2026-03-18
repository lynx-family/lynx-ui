// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root, useRef, useState } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import './index.css'

/**
 * Internal Testing Example
 *
 * This example is designed to test various edge cases and state transitions:
 * 1. Rapid open/close calls
 * 2. Drag resurrection (drag during close animation)
 * 3. Controlled vs uncontrolled mode switching
 * 4. Multiple snap points
 * 5. Callbacks timing
 */
function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [controlled, setControlled] = useState(false)
  const [show, setShow] = useState(false)

  const log = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    console.log(`[${time}] ${msg}`)
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 9)])
  }

  // Test: Rapid open/close
  const testRapidOpenClose = () => {
    log('TEST: Rapid open/close')
    sheetRef.current?.show()
    setTimeout(() => sheetRef.current?.close(), 100)
    setTimeout(() => sheetRef.current?.show(), 200)
    setTimeout(() => sheetRef.current?.close(), 300)
    setTimeout(() => sheetRef.current?.show(), 400)
  }

  // Test: Double open
  const testDoubleOpen = () => {
    log('TEST: Double open (should ignore second)')
    sheetRef.current?.show()
    setTimeout(() => sheetRef.current?.show(), 50)
  }

  // Test: Double close
  const testDoubleClose = () => {
    log('TEST: Double close (should ignore second)')
    sheetRef.current?.close()
    setTimeout(() => sheetRef.current?.close(), 50)
  }

  // Test: Snap during entry
  const testSnapDuringEntry = () => {
    log('TEST: snapTo during entry animation')
    sheetRef.current?.show()
    setTimeout(() => sheetRef.current?.snapTo(2), 100)
  }

  // Test: Close during entry
  const testCloseDuringEntry = () => {
    log('TEST: close during entry animation')
    sheetRef.current?.show()
    setTimeout(() => sheetRef.current?.close(), 150)
  }

  return (
    <view className='container lunaris-dark'>
      <text className='title-text'>Internal Testing</text>

      <view className='mode-toggle'>
        <text className='mode-text'>
          Mode: {controlled ? 'CONTROLLED' : 'UNCONTROLLED'}
        </text>
        <view
          className='toggle-button'
          bindtap={() => setControlled(c => !c)}
        >
          <text className='toggle-text'>Toggle Mode</text>
        </view>
      </view>

      <view className='button-row'>
        <view
          className='small-button'
          bindtap={() => {
            if (controlled) {
              setShow(true)
            } else {
              sheetRef.current?.show()
            }
          }}
        >
          <text className='small-button-text'>Open</text>
        </view>
        <view
          className='small-button'
          bindtap={() => {
            if (controlled) {
              setShow(false)
            } else {
              sheetRef.current?.close()
            }
          }}
        >
          <text className='small-button-text'>Close</text>
        </view>
      </view>

      <text className='section-title'>Edge Case Tests</text>

      <view className='button-row'>
        <view className='test-button' bindtap={testRapidOpenClose}>
          <text className='test-button-text'>Rapid Open/Close</text>
        </view>
        <view className='test-button' bindtap={testDoubleOpen}>
          <text className='test-button-text'>Double Open</text>
        </view>
      </view>

      <view className='button-row'>
        <view className='test-button' bindtap={testDoubleClose}>
          <text className='test-button-text'>Double Close</text>
        </view>
        <view className='test-button' bindtap={testSnapDuringEntry}>
          <text className='test-button-text'>Snap During Entry</text>
        </view>
      </view>

      <view className='button-row'>
        <view className='test-button' bindtap={testCloseDuringEntry}>
          <text className='test-button-text'>Close During Entry</text>
        </view>
      </view>

      <text className='section-title'>Event Log</text>
      <view className='log-container'>
        {logs.map((logEntry, i) => (
          <text key={i} className='log-entry'>{logEntry}</text>
        ))}
      </view>

      <SheetRoot
        ref={sheetRef}
        show={controlled ? show : undefined}
        onShowChange={(newShow) => {
          log(`onShowChange: ${newShow}`)
          if (controlled) {
            setShow(newShow)
          }
        }}
        onOpen={() => log('onOpen')}
        onClose={() => log('onClose')}
        snapPoints={['25%', '50%', '75%']}
        initialSnap={1}
        onSnapChange={(index, value) => {
          log(`onSnapChange: index=${index} value=${Math.round(value)}`)
        }}
      >
        <SheetView className='action-sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <SheetContent
            className='sheet-content'
            snapAnimation={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <SheetHandle
              className='sheet-handle'
              style={{
                width: '40px',
                height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                alignSelf: 'center',
                marginTop: '8px',
                borderRadius: '2px',
              }}
            />
            <view className='control-panel'>
              <text className='header-text'>Test Sheet</text>
              <text className='info-text'>
                Try dragging during close animation to test resurrection. Also
                test rapid snap point changes.
              </text>

              <view className='snap-row'>
                <view
                  className='snap-button'
                  bindtap={() => sheetRef.current?.snapTo(0)}
                >
                  <text className='snap-text'>25%</text>
                </view>
                <view
                  className='snap-button'
                  bindtap={() => sheetRef.current?.snapTo(1)}
                >
                  <text className='snap-text'>50%</text>
                </view>
                <view
                  className='snap-button'
                  bindtap={() => sheetRef.current?.snapTo(2)}
                >
                  <text className='snap-text'>75%</text>
                </view>
              </view>

              <view className='snap-row'>
                <view
                  className='snap-button'
                  bindtap={() => sheetRef.current?.expand()}
                >
                  <text className='snap-text'>Expand</text>
                </view>
                <view
                  className='snap-button'
                  bindtap={() => sheetRef.current?.collapse()}
                >
                  <text className='snap-text'>Collapse</text>
                </view>
              </view>

              <view
                className='control-button'
                style={{ backgroundColor: 'rgba(255, 100, 100, 0.2)' }}
                bindtap={() => {
                  if (controlled) {
                    setShow(false)
                  } else {
                    sheetRef.current?.close()
                  }
                }}
              >
                <text className='control-text' style={{ color: '#ff6b6b' }}>
                  Close Sheet
                </text>
              </view>
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)

export default App
