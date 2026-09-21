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

import { ActionButton, TriggerButton } from '../shared/index.js'
import './index.css'

const paymentMethods = Array.from(
  { length: 12 },
  (_, index) => `Payment method ${index + 1}`,
)

function PaymentMethodList() {
  const gesture = useSheetScrollGesture()

  return (
    <scroll-view
      className='payment-methods'
      scroll-orientation='vertical'
      bounces={false}
      main-thread:gesture={gesture}
    >
      {paymentMethods.map((method, index) => (
        <view className='payment-method' key={method}>
          <view className='payment-icon' />
          <view className='payment-copy'>
            <text className='payment-title'>{method}</text>
            <text className='payment-detail'>•••• {1000 + index}</text>
          </view>
        </view>
      ))}
    </scroll-view>
  )
}

function App() {
  const sheetRef = useRef<SheetRootRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Gesture Sheet + Fixed Footer</text>
      <text className='subtitle-text'>
        Scrollable content and fixed actions are sibling layout regions.
      </text>
      <TriggerButton
        onClick={() => sheetRef.current?.open()}
        text='Choose a payment method'
      />

      <SheetRoot ref={sheetRef} snapPoints={['55%', '90%']} initialSnap={0}>
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetGestureContent
            className='sheet-content payment-sheet'
            innerClassName='payment-layout'
          >
            <SheetHandle className='sheet-handle' />
            <view className='payment-heading'>
              <text className='payment-heading-title'>Payment methods</text>
              <text className='payment-heading-copy'>
                Only this middle region scrolls.
              </text>
            </view>
            <PaymentMethodList />
            <view className='fixed-actions'>
              <ActionButton
                onClick={() => sheetRef.current?.close()}
                text='Continue'
              />
            </view>
          </SheetGestureContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)
export default App
