// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, runOnBackground, useRef, useState } from '@lynx-js/react'

import {
  Button,
  SheetBackdrop,
  SheetBody,
  SheetHandle,
  SheetNestedScrollContent,
  SheetPositioner,
  SheetRoot,
  SheetView,
  screenHeight,
  screenWidth,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { SurfaceRows } from '../shared/SurfaceRows.js'
import './index.css'

// Simulate host-provided safe areas, including an asymmetric horizontal inset.
const viewportInsets = { top: 64, right: 36, bottom: 24, left: 16 }

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  const [show, setShow] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [viewport, setViewport] = useState({
    width: screenWidth,
    height: screenHeight,
  })
  const fullscreenHeight = viewport.height

  function onSnapStart(_index: number, value: number) {
    'main thread'
    // The example closes the external gap after release toward fullscreen.
    runOnBackground(setFullscreen)(value >= fullscreenHeight)
  }

  return (
    <view
      className='demo-container luna-light'
      bindlayoutchange={event => {
        const { width, height } = event.detail
        if (width > 0 && height > 0) setViewport({ width, height })
      }}
    >
      <view className='launcher'>
        <text className='title'>Room for the content</text>
        <text className='description'>
          Drag upward: content stops at the inset guides while the handle keeps
          moving. Continue inside the list to scroll.
        </text>
        <Button
          className='action'
          onClick={() => {
            setFullscreen(false)
            setShow(true)
          }}
        >
          <text className='action-label'>Open reader</text>
        </Button>
      </view>
      <SheetRoot
        ref={sheetRef}
        show={show}
        onShowChange={setShow}
        screenHeight={viewport.height}
        screenWidth={viewport.width}
        snapPoints={['45%', '100%']}
        main-thread:onSnapStart={onSnapStart}
      >
        <SheetView className='sheet-viewport'>
          <SheetPositioner width={viewport.width} height={viewport.height}>
            <SheetBackdrop className='sheet-backdrop' />
            <SheetNestedScrollContent
              className='sheet-surface'
              innerClassName='sheet-layout'
              panelLayout={{ bottomGap: fullscreen ? 0 : 8 }}
            >
              {({ scrollGesture }) => (
                <>
                  <SheetHandle className='handle'>
                    <view id='safe-area-grabber' className='grabber' />
                  </SheetHandle>
                  <SheetBody
                    className='sheet-body'
                    viewportInsets={viewportInsets}
                  >
                    <view id='safe-area-header' className='header'>
                      <text className='reader-title'>Saved reading</text>
                      <Button className='action' onClick={() => setShow(false)}>
                        <text className='action-label'>Close</text>
                      </Button>
                    </view>
                    <view className='controls'>
                      <Button
                        className='action'
                        onClick={() => sheetRef.current?.collapse()}
                      >
                        <text className='action-label'>45%</text>
                      </Button>
                      <Button
                        className='action'
                        onClick={() => sheetRef.current?.expand()}
                      >
                        <text className='action-label'>Fullscreen</text>
                      </Button>
                    </view>
                    <scroll-view
                      id='safe-area-scroll'
                      className='reader-scroll'
                      scroll-orientation='vertical'
                      main-thread:gesture={scrollGesture}
                      bounces={true}
                    >
                      <SurfaceRows />
                    </scroll-view>
                  </SheetBody>
                </>
              )}
            </SheetNestedScrollContent>
            <view
              id='safe-area-guide'
              className='inset-guide'
              style={{
                top: `${viewportInsets.top}px`,
                right: `${viewportInsets.right}px`,
                bottom: `${viewportInsets.bottom}px`,
                left: `${viewportInsets.left}px`,
              }}
              event-through={true}
            />
          </SheetPositioner>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)
export default App
