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

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  // Fully controlled state - parent manages show/hide
  const [show, setShow] = useState(false)

  return (
    <view className='container lunaris-dark'>
      <text className='title-text'>Fully Controlled Sheet</text>
      <text className='subtitle-text'>
        State: {show ? 'OPEN' : 'CLOSED'}
      </text>

      <view className='button' bindtap={() => setShow(true)}>
        <text className='button-text'>Open (setShow(true))</text>
      </view>

      <view className='button' bindtap={() => setShow(false)}>
        <text className='button-text'>Close (setShow(false))</text>
      </view>

      <view className='button' bindtap={() => setShow(s => !s)}>
        <text className='button-text'>Toggle</text>
      </view>

      <SheetRoot
        ref={sheetRef}
        show={show}
        onShowChange={(newShow) => {
          console.log('onShowChange:', newShow)
          setShow(newShow)
        }}
        onOpen={() => {
          console.log('onOpen - sheet fully opened')
        }}
        onClose={() => {
          console.log('onClose - sheet fully closed')
        }}
        snapPoints={['40%', '80%']}
        initialSnap={0}
        onSnapChange={(snapIndex, snapValue) => {
          console.log('onSnapChange:', snapIndex, snapValue)
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
              <text className='header-text'>
                Controlled Mode
              </text>
              <text className='info-text'>
                The parent component manages the `show` state. Backdrop clicks
                and gestures trigger `onShowChange`.
              </text>

              <view
                className='control-button'
                bindtap={() => sheetRef.current?.snapTo(0)}
              >
                <text className='control-text'>Snap to 40% (Index 0)</text>
              </view>

              <view
                className='control-button'
                bindtap={() => sheetRef.current?.snapTo(1)}
              >
                <text className='control-text'>Snap to 80% (Index 1)</text>
              </view>

              <view
                className='control-button'
                style={{ backgroundColor: 'rgba(255, 100, 100, 0.2)' }}
                bindtap={() => setShow(false)}
              >
                <text className='control-text' style={{ color: '#ff6b6b' }}>
                  Close (via state)
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
