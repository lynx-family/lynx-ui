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
      <text className='title-text'>Uncontrolled - defaultShow=true</text>

      <view className='button' bindtap={() => sheetRef.current?.show()}>
        <text className='button-text'>Open Sheet</text>
      </view>

      <view className='button' bindtap={() => sheetRef.current?.close()}>
        <text className='button-text'>Close Sheet</text>
      </view>

      <SheetRoot
        ref={sheetRef}
        defaultShow={true}
        onShowChange={(newShow) => console.log('onShowChange:', newShow)}
        onOpen={() => console.log('onOpen')}
        onClose={() => console.log('onClose')}
        snapPoints={['50%', '80%']}
        initialSnap={0}
      >
        <SheetView className='action-sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
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
            <view className='control-panel'>
              <text className='header-text'>
                Initially Open (defaultShow)
              </text>
              <text className='info-text'>
                This sheet starts with defaultShow=true in uncontrolled mode.
              </text>

              <view
                className='control-button'
                style={{ backgroundColor: 'rgba(255, 100, 100, 0.2)' }}
                bindtap={() => sheetRef.current?.close()}
              >
                <text className='control-text' style={{ color: '#ff6b6b' }}>
                  Close (via ref)
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
