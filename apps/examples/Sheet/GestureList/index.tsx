// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetGestureContent,
  SheetHandle,
  SheetRoot,
  SheetView,
  useSheetScrollGesture,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { TriggerButton } from '../shared/index.js'
import './index.css'

function NestedList() {
  const gesture = useSheetScrollGesture()
  return (
    <list
      className='nested-list'
      scroll-orientation='vertical'
      list-type='single'
      span-count={1}
      bounces={false}
      main-thread:gesture={gesture}
    >
      {Array.from(
        { length: 30 },
        (_, index) => (
          <list-item item-key={`item-${index}`} key={index}>
            <view className='list-item'>
              <text>{`List item ${index + 1}`}</text>
            </view>
          </list-item>
        ),
      )}
    </list>
  )
}

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Gesture Sheet + List</text>
      <text className='subtitle-text'>
        The shared gesture expands the Sheet fully before the List scrolls.
      </text>
      <TriggerButton
        onClick={() => sheetRef.current?.open()}
        text='Open Sheet'
      />
      <SheetRoot
        ref={sheetRef}
        snapPoints={['35%', '65%', '90%']}
        initialSnap={0}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetGestureContent
            className='sheet-content'
            innerClassName='gesture-sheet-inner'
          >
            <SheetHandle className='sheet-handle' />
            <view className='example-description'>
              <text className='example-label'>Natural handoff</text>
              <text className='example-copy'>
                Up: Sheet then List · Down: List then Sheet
              </text>
            </view>
            <NestedList />
          </SheetGestureContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)
export default App
