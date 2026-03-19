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

import { ControlButton, TriggerButton } from '../shared/index.js'

import './index.css'

const snapPoints = ['50%', '80%']

function App() {
  const sheetRef = useRef<SheetRootRef>(null)

  return (
    <view className='container lunaris-dark'>
      <text className='title-text'>Uncontrolled - defaultShow=true</text>

      <TriggerButton
        onClick={() => sheetRef.current?.show()}
        text='Open Sheet'
      />

      <TriggerButton
        onClick={() => sheetRef.current?.close()}
        text='Close Sheet'
      />

      <SheetRoot
        ref={sheetRef}
        defaultShow={true}
        onShowChange={(newShow) => console.log('onShowChange:', newShow)}
        onOpen={() => console.log('onOpen')}
        onClose={() => console.log('onClose')}
        snapPoints={snapPoints}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <SheetContent
            className='sheet-content'
            innerClassName='sheet-inner-content'
          >
            <SheetHandle className='sheet-handle' />
            <view className='control-panel'>
              <text className='header-text'>
                Initially Open (defaultShow)
              </text>
              <text className='info-text'>
                This sheet starts with defaultShow=true in uncontrolled mode.
              </text>

              <ControlButton
                onClick={() => sheetRef.current?.close()}
                text='Close (via ref)'
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)

export default App
