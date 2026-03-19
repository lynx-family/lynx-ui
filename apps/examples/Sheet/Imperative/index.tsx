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

const snapPoints = ['30%', '60%', '90%']

function App() {
  const sheetRef = useRef<SheetRootRef>(null)

  return (
    <view className='container lunaris-dark'>
      <TriggerButton
        text='Open Sheet (via ref)'
        onClick={() => sheetRef.current?.show()}
      />

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
        snapPoints={snapPoints}
        initialSnap={1}
        onSnapChange={(snapIndex, snapValue) => {
          console.log(snapIndex, snapValue)
        }}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' clickToClose={true} />
          <SheetContent
            className='sheet-content'
            innerClassName='sheet-inner-content'
            snapAnimation={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <SheetHandle className='sheet-handle' />
            <view className='control-panel'>
              <text className='header-text'>
                Imperative Controls
              </text>

              <ControlButton
                text='Snap to 30% (Index 0)'
                onClick={() => sheetRef.current?.snapTo(0)}
              />
              <ControlButton
                text='Snap to 60% (Index 1)'
                onClick={() => sheetRef.current?.snapTo(1)}
              />
              <ControlButton
                text='Snap to 90% (Index 2)'
                onClick={() => sheetRef.current?.snapTo(2)}
              />
              <ControlButton
                text='Expand (Max)'
                onClick={() => sheetRef.current?.expand()}
              />
              <ControlButton
                text='Collapse (Min)'
                onClick={() => sheetRef.current?.collapse()}
              />
              <ControlButton
                text='Close via Ref'
                onClick={() => sheetRef.current?.close()}
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
