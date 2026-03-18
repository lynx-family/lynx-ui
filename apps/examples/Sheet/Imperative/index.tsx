// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { root, useRef } from '@lynx-js/react'

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

  return (
    <view className='container lunaris-dark'>
      <view className='button' bindtap={() => sheetRef.current?.show()}>
        <text className='button-text'>Open Sheet (via ref)</text>
      </view>

      <SheetRoot
        ref={sheetRef}
        onShowChange={(show) => {
          console.log('show change', show)
        }}
        onOpen={() => {
          console.log('open change')
        }}
        onClose={() => {
          console.log('close change')
        }}
        snapPoints={['30%', '60%', '90%']}
        initialSnap={0}
        onSnapChange={(snapIndex, snapValue) => {
          console.log(snapIndex, snapValue)
        }}
      >
        <SheetView className='action-sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <SheetContent
            className='sheet-content'
            snapAnimation={{ type: 'spring', stiffness: 300, damping: 20 }}
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
                Imperative Controls
              </text>

              <view
                className='control-button'
                bindtap={() => sheetRef.current?.snapTo(0)}
              >
                <text className='control-text'>Snap to 30% (Index 0)</text>
              </view>

              <view
                className='control-button'
                bindtap={() => sheetRef.current?.snapTo(1)}
              >
                <text className='control-text'>Snap to 60% (Index 1)</text>
              </view>

              <view
                className='control-button'
                bindtap={() => sheetRef.current?.snapTo(2)}
              >
                <text className='control-text'>Snap to 90% (Index 2)</text>
              </view>

              <view
                className='control-button'
                bindtap={() => sheetRef.current?.expand()}
              >
                <text className='control-text'>Expand (Max)</text>
              </view>

              <view
                className='control-button'
                bindtap={() => sheetRef.current?.collapse()}
              >
                <text className='control-text'>Collapse (Min)</text>
              </view>

              <view
                className='control-button'
                style={{ backgroundColor: 'rgba(255, 100, 100, 0.2)' }}
                bindtap={() => sheetRef.current?.close()}
              >
                <text className='control-text' style={{ color: '#ff6b6b' }}>
                  Close via Ref
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
