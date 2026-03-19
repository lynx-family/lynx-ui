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

import { ControlButton, TriggerButton } from '../shared/index.js'

import './index.css'

const snapPoints = ['50%', '80%']

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  // Controlled mode with initial show={true}
  const [show, setShow] = useState(true)

  return (
    <view className='container lunaris-dark'>
      <text className='title-text'>Controlled - Initially Open</text>
      <text className='subtitle-text'>
        State: {show ? 'OPEN' : 'CLOSED'}
      </text>

      <TriggerButton
        onClick={() => setShow(true)}
        text='Open (setShow(true))'
      />

      <TriggerButton
        onClick={() => setShow(false)}
        text='Close (setShow(false))'
      />

      <SheetRoot
        ref={sheetRef}
        show={show}
        onShowChange={(newShow) => {
          console.log('onShowChange:', newShow)
          setShow(newShow)
        }}
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
                Initially Open (Controlled)
              </text>
              <text className='info-text'>
                This sheet starts with show=true in controlled mode.
              </text>

              <ControlButton
                onClick={() => setShow(false)}
                text='Close (via state)'
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
