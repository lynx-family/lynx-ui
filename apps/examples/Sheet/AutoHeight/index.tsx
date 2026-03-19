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
        snapPoints={['fit']}
        initialSnap={0}
        claimedGestureAngles={[[-135, -45], [45, 135]]}
        onSnapChange={(snapIndex, snapValue) => {
          console.log(snapIndex, snapValue)
        }}
      >
        <SheetView className='action-sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetContent className='sheet-content'>
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
            <view className='control-panel' style='height: 400px'>
              <text className='header-text'>
                Long Content
              </text>

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
