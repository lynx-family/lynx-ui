// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useMainThreadRef, useRef } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetHandle,
  SheetNestedScrollContent,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef, SheetTransitionEvent } from '@lynx-js/lynx-ui'
import type { MainThread } from '@lynx-js/types'

import { ActionButton, TriggerButton } from '../shared/index.js'
import './index.css'

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  const containerRef = useMainThreadRef<MainThread.Element | null>(null)
  const currentWidth = useMainThreadRef(0)
  const startWidth = useMainThreadRef(0)
  const targetWidth = useMainThreadRef(0)
  const screenWidth = lynx.__globalProps.screenWidth || 375
  const narrowWidth = Math.min(screenWidth - 32, 300)
  const wideWidth = screenWidth - 32

  function onTransition(event: SheetTransitionEvent) {
    'main thread'
    if (event.kind !== 'snap' || !event.target) return
    if (event.phase === 'start') {
      startWidth.current = currentWidth.current || narrowWidth
      targetWidth.current = event.target.index === 1 ? wideWidth : narrowWidth
    }
    if (event.phase === 'frame') {
      const width = startWidth.current
        + (targetWidth.current - startWidth.current) * event.progress
      currentWidth.current = width
      containerRef.current?.setStyleProperties({
        width: `${width}px`,
        left: `${(screenWidth - width) / 2}px`,
      })
    }
  }

  return (
    <view className='demo-container lunaris-dark'>
      <text className='title-text'>Coordinated Sheet Transition</text>
      <text className='subtitle-text'>
        Release the Sheet to animate its width with its snap.
      </text>
      <TriggerButton
        text='Open Sheet'
        onClick={() => sheetRef.current?.open()}
      />
      <SheetRoot
        ref={sheetRef}
        snapPoints={['45%', '90%']}
        main-thread:onTransition={onTransition}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <view
            main-thread:ref={containerRef}
            style={{
              position: 'absolute',
              top: '0px',
              height: '100%',
              width: `${narrowWidth}px`,
              left: `${(screenWidth - narrowWidth) / 2}px`,
            }}
          >
            <SheetNestedScrollContent
              className='sheet-content'
              innerClassName='transition-inner'
            >
              {({ scrollGesture }) => (
                <>
                  <SheetHandle className='sheet-handle' />
                  <view className='transition-actions'>
                    <ActionButton
                      text='Collapse'
                      onClick={() => sheetRef.current?.collapse()}
                    />
                    <ActionButton
                      text='Expand'
                      onClick={() => sheetRef.current?.expand()}
                    />
                  </view>
                  <scroll-view
                    className='transition-scroll'
                    scroll-orientation='vertical'
                    bounces={false}
                    main-thread:gesture={scrollGesture}
                  >
                    {Array.from(
                      { length: 12 },
                      (_, index) => (
                        <view className='transition-item' key={index}>
                          <text>{`Item ${index + 1}`}</text>
                        </view>
                      ),
                    )}
                  </scroll-view>
                </>
              )}
            </SheetNestedScrollContent>
          </view>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)
export default App
