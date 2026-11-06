// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import {
  Button,
  SheetBackdrop,
  SheetHandle,
  SheetNestedScrollContent,
  SheetRoot,
  SheetView,
  screenWidth,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { TriggerButton } from '../shared/index.js'
import { SurfaceRows } from '../shared/SurfaceRows.js'
import './index.css'

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  const [detached, setDetached] = useState(true)
  const [bottomInset, setBottomInset] = useState(8)
  const width = Math.min(screenWidth - 32, 664)

  return (
    <view className='demo-container surface-stage lunaris-dark'>
      <view className='surface-launcher'>
        <text className='surface-title'>A floating reading panel</text>
        <text className='surface-copy'>
          Change the bottom gap or surface coverage while keeping your place.
          Tap beside the card to dismiss it.
        </text>
        <TriggerButton
          text='Open panel'
          onClick={() => sheetRef.current?.open()}
        />
      </view>
      <SheetRoot ref={sheetRef} snapPoints={['45%', '80%']}>
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetNestedScrollContent
            detached={detached}
            bottomInset={bottomInset}
            className='sheet-content surface-card'
            innerClassName='surface-layout'
            style={{
              width: `${width}px`,
              left: `${(screenWidth - width) / 2}px`,
            }}
          >
            {({ scrollGesture }) => (
              <>
                <SheetHandle className='sheet-handle' />
                <view className='surface-body'>
                  <text className='surface-title'>
                    {detached ? 'Floating' : 'Attached'}
                  </text>
                  <view className='surface-controls'>
                    <Button
                      className='surface-action'
                      onClick={() => setDetached(value => !value)}
                    >
                      <text className='surface-action-text'>
                        Switch coverage
                      </text>
                    </Button>
                    <Button
                      className='surface-action'
                      onClick={() =>
                        setBottomInset(value => value === 0 ? 8 : 0)}
                    >
                      <text className='surface-action-text'>
                        {`Bottom gap: ${bottomInset}px`}
                      </text>
                    </Button>
                    <Button
                      className='surface-action'
                      onClick={() => sheetRef.current?.expand()}
                    >
                      <text className='surface-action-text'>80%</text>
                    </Button>
                  </view>
                </view>
                <scroll-view
                  className='surface-scroll'
                  scroll-orientation='vertical'
                  bounces={false}
                  main-thread:gesture={scrollGesture}
                >
                  <SurfaceRows />
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
