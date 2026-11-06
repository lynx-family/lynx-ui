// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef } from '@lynx-js/react'

import {
  Button,
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { TriggerButton } from '../shared/index.js'
import './index.css'

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  return (
    <view className='demo-container surface-stage lunaris-dark'>
      <view className='surface-launcher'>
        <text className='surface-title'>An anchored panel</text>
        <text className='surface-copy'>
          Pull beyond the highest stop. The panel background continues to the
          bottom edge.
        </text>
        <TriggerButton
          text='Open panel'
          onClick={() => sheetRef.current?.open()}
        />
      </view>
      <SheetRoot ref={sheetRef} snapPoints={['45%', '75%']}>
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetContent
            className='sheet-content'
            innerClassName='surface-layout'
          >
            <SheetHandle className='sheet-handle' />
            <view className='surface-body'>
              <text className='surface-title'>Room to stretch</text>
              <text className='surface-copy'>
                Drag the panel upward past its stop, then let go. The surface
                stays painted below the content while it springs back.
              </text>
              <view className='surface-controls'>
                <Button
                  className='surface-action'
                  onClick={() => sheetRef.current?.collapse()}
                >
                  <text className='surface-action-text'>45%</text>
                </Button>
                <Button
                  className='surface-action'
                  onClick={() => sheetRef.current?.expand()}
                >
                  <text className='surface-action-text'>75%</text>
                </Button>
                <Button
                  className='surface-action'
                  onClick={() => sheetRef.current?.close()}
                >
                  <text className='surface-action-text'>Close</text>
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
