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

import { ActionButton, TriggerButton } from '../shared/index.js'
import './index.css'

const fitSnapPoints = ['fit']
const fitAndPercentSnapPoints = ['fit', '80%']
const claimedGestureAngles: [number, number][] = [[-135, -45], [45, 135]]

const longText =
  'The Sheet component supports autoHeight mode, where the height is dynamically calculated based on its content. '
    .repeat(10)

function App() {
  const fitSheetRef = useRef<SheetRootRef>(null)
  const fitAndPercentSheetRef = useRef<SheetRootRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Sheet Auto Height</text>

      <view className='button-group'>
        <TriggerButton
          onClick={() => fitSheetRef.current?.open()}
          text='Open Fit Sheet'
        />
        <TriggerButton
          onClick={() => fitAndPercentSheetRef.current?.open()}
          text='Open Fit + 80% Sheet'
        />
      </view>

      <SheetRoot
        ref={fitSheetRef}
        onShowChange={(show) => {
          console.log('fit show change', show)
        }}
        onOpen={() => {
          console.log('fit open change')
        }}
        onClose={() => {
          console.log('fit close change')
        }}
        snapPoints={fitSnapPoints}
        initialSnap={0}
        claimedGestureAngles={claimedGestureAngles}
        onSnapChange={(snapIndex, snapValue) => {
          console.log('fit snap change', snapIndex, snapValue)
        }}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetContent
            className='sheet-content'
            innerClassName='sheet-inner-content'
          >
            <SheetHandle className='sheet-handle' />
            <view className='control-panel'>
              <text className='header-text'>
                Fit Sheet with Long Content
              </text>
              <text className='info-text'>snapPoints=["fit"]</text>
              <text className='info-text'>{longText}</text>
              <ActionButton
                onClick={() => fitSheetRef.current?.close()}
                text='Close via Ref'
              />
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>

      <SheetRoot
        ref={fitAndPercentSheetRef}
        snapPoints={fitAndPercentSnapPoints}
        initialSnap={0}
        claimedGestureAngles={claimedGestureAngles}
        onSnapChange={(snapIndex, snapValue) => {
          console.log('fit + 80% snap change', snapIndex, snapValue)
        }}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetContent
            className='sheet-content'
            innerClassName='sheet-inner-content'
          >
            <SheetHandle className='sheet-handle' />
            <view className='control-panel'>
              <text className='header-text'>
                Fit Sheet with Percent Snap
              </text>
              <text className='info-text'>snapPoints=["fit", "80%"]</text>
              <text className='info-text'>
                The fit snap uses measured content height, while 80% resolves
                against the viewport height.
              </text>
              <ActionButton
                onClick={() => fitAndPercentSheetRef.current?.snapTo(0)}
                text='Snap to fit'
              />
              <ActionButton
                onClick={() => fitAndPercentSheetRef.current?.snapTo(1)}
                text='Snap to 80%'
              />
              <ActionButton
                onClick={() => fitAndPercentSheetRef.current?.close()}
                text='Close via Ref'
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
