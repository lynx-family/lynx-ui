// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  root,
  runOnMainThread,
  useMainThreadRef,
  useRef,
  useState,
} from '@lynx-js/react'

import {
  Button,
  SheetBackdrop,
  SheetHandle,
  SheetNestedScrollContent,
  SheetRoot,
  SheetView,
  screenWidth,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef, SheetSurfaceController } from '@lynx-js/lynx-ui'

import { TriggerButton } from '../shared/index.js'
import { SurfaceRows } from '../shared/SurfaceRows.js'
import './index.css'

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  const surfaceControllerRef = useMainThreadRef<SheetSurfaceController | null>(
    null,
  )
  const [bounded, setBounded] = useState(true)
  const [bottomGap, setBottomGap] = useState(8)
  const width = Math.min(screenWidth - 32, 664)
  const sideInset = (screenWidth - width) / 2
  const openingCornerRadius = bounded ? 24 : { topLeft: 24, topRight: 24 }
  const openingInsets = {
    left: sideInset,
    right: sideInset,
    bottom: bounded ? bottomGap : 0,
  }

  function applySurface(nextBounded: boolean, nextGap: number) {
    'main thread'
    surfaceControllerRef.current?.setInsets({
      left: sideInset,
      right: sideInset,
      bottom: nextBounded ? nextGap : 0,
    })
    surfaceControllerRef.current?.setCornerRadius(
      nextBounded ? 24 : { topLeft: 24, topRight: 24 },
    )
  }

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
            main-thread:surfaceControllerRef={surfaceControllerRef}
            initialCornerRadius={openingCornerRadius}
            initialInsets={openingInsets}
            className='sheet-content'
            innerClassName='surface-layout'
          >
            {({ scrollGesture }) => (
              <>
                <SheetHandle className='sheet-handle' />
                <view className='surface-body'>
                  <text className='surface-title'>
                    {bounded ? 'Floating' : 'Attached'}
                  </text>
                  <view className='surface-controls'>
                    <Button
                      className='surface-action'
                      onClick={() => {
                        const nextBounded = !bounded
                        setBounded(nextBounded)
                        runOnMainThread(applySurface)(nextBounded, bottomGap)
                      }}
                    >
                      <text className='surface-action-text'>
                        Switch coverage
                      </text>
                    </Button>
                    <Button
                      className='surface-action'
                      onClick={() => {
                        const nextGap = bottomGap === 0 ? 8 : 0
                        setBottomGap(nextGap)
                        runOnMainThread(applySurface)(bounded, nextGap)
                      }}
                    >
                      <text className='surface-action-text'>
                        {`Bottom gap: ${bottomGap}px`}
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
                  bounces={true}
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
