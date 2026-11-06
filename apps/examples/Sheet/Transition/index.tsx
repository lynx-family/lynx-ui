// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, runOnBackground, useRef, useState } from '@lynx-js/react'

import {
  SheetBackdrop,
  SheetHandle,
  SheetNestedScrollContent,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { ActionButton, TriggerButton } from '../shared/index.js'
import './index.css'

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  const [panel, setPanel] = useState({ expanded: false, animated: false })
  const screenWidth = lynx.__globalProps.screenWidth || 375
  const narrowWidth = Math.min(screenWidth - 32, 300)
  const wideWidth = screenWidth - 32
  const width = panel.expanded ? wideWidth : narrowWidth

  function updatePanel(index: number, animated: boolean) {
    setPanel({ expanded: index === 1, animated })
  }

  function onSnapStart(index: number, _value: number, animated: boolean) {
    'main thread'
    runOnBackground(updatePanel)(index, animated)
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
        main-thread:onSnapStart={onSnapStart}
        onClose={() => setPanel({ expanded: false, animated: false })}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetNestedScrollContent
            // A narrower inner panel needs Lynx SDK 3.5+ for outside taps.
            innerClassName='sheet-content transition-inner'
            innerStyle={{
              width: `${width}px`,
              left: `${(screenWidth - width) / 2}px`,
              transition: panel.animated
                ? 'width 280ms ease-out, left 280ms ease-out'
                : 'none',
            }}
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
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)
export default App
