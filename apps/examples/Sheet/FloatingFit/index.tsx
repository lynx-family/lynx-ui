// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import {
  Button,
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetView,
  screenWidth,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { TriggerButton } from '../shared/index.js'
import './index.css'

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  const [details, setDetails] = useState(false)
  const width = Math.min(screenWidth - 32, 480)
  return (
    <view className='demo-container surface-stage lunaris-dark'>
      <view className='surface-launcher'>
        <text className='surface-title'>Just enough room</text>
        <text className='surface-copy'>
          A floating panel that fits its content, with an 8px gap outside it.
        </text>
        <TriggerButton
          text='Review delivery'
          onClick={() => sheetRef.current?.open()}
        />
      </view>
      <SheetRoot ref={sheetRef} snapPoints={['fit']}>
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetContent
            detached
            bottomInset={8}
            className='sheet-content surface-card'
            innerClassName='surface-layout'
            style={{
              width: `${width}px`,
              left: `${(screenWidth - width) / 2}px`,
            }}
          >
            <SheetHandle className='sheet-handle' />
            <view className='surface-body'>
              <text className='surface-title'>Delivery tomorrow</text>
              <text className='surface-copy'>
                Your order will arrive between 9am and 6pm.
              </text>
              {details && (
                <text className='surface-copy'>
                  We will send a notification when your delivery is nearby. You
                  can leave instructions for the courier before it arrives.
                </text>
              )}
              <view className='surface-controls'>
                <Button
                  className='surface-action'
                  onClick={() => setDetails(value => !value)}
                >
                  <text className='surface-action-text'>
                    {details ? 'Less detail' : 'More detail'}
                  </text>
                </Button>
                <Button
                  className='surface-action'
                  onClick={() => sheetRef.current?.close()}
                >
                  <text className='surface-action-text'>Done</text>
                </Button>
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
