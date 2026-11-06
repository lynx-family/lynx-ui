// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, runOnBackground, useRef, useState } from '@lynx-js/react'

import {
  Button,
  SheetBackdrop,
  SheetHandle,
  SheetNestedScrollContent,
  SheetRoot,
  SheetView,
  screenHeight,
  screenWidth,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'
import clsx from 'clsx'

import { TriggerButton } from '../shared/index.js'
import { SurfaceRows } from '../shared/SurfaceRows.js'
import './index.css'

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  const [panel, setPanel] = useState({ fullscreen: false, animated: false })
  const [viewport, setViewport] = useState({
    width: screenWidth,
    height: screenHeight,
  })
  const fullscreenHeight = viewport.height
  const floatingWidth = Math.min(viewport.width - 48, 664)
  const width = panel.fullscreen ? viewport.width : floatingWidth

  function updatePanel(fullscreen: boolean, animated: boolean) {
    setPanel({ fullscreen, animated })
  }

  function onSnapStart(_index: number, value: number, animated: boolean) {
    'main thread'
    // Fullscreen is a product policy, not the index of the largest snap point.
    runOnBackground(updatePanel)(value >= fullscreenHeight, animated)
  }

  return (
    <view
      className='demo-container surface-stage lunaris-dark'
      bindlayoutchange={event =>
        setViewport({ width: event.detail.width, height: event.detail.height })}
    >
      <view className='surface-launcher'>
        <text className='surface-title'>Room to read</text>
        <text className='surface-copy'>
          Release at fullscreen to widen the panel. Text keeps its natural size.
        </text>
        <TriggerButton
          text='Open reader'
          onClick={() => {
            setPanel({ fullscreen: false, animated: false })
            sheetRef.current?.open()
          }}
        />
      </view>
      <SheetRoot
        ref={sheetRef}
        screenHeight={fullscreenHeight}
        snapPoints={['45%', '70%', '100%']}
        main-thread:onSnapStart={onSnapStart}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetNestedScrollContent
            detached={!panel.fullscreen}
            bottomInset={panel.fullscreen ? 0 : 8}
            className={clsx(
              'sheet-content',
              !panel.fullscreen && 'surface-card',
            )}
            innerClassName='surface-layout'
            style={{
              width: `${width}px`,
              left: `${(viewport.width - width) / 2}px`,
              // This CSS transition has its own clock; it does not follow the snap spring.
              transition: panel.animated
                ? 'width 280ms ease-out, left 280ms ease-out'
                : 'none',
            }}
          >
            {({ scrollGesture }) => (
              <>
                <SheetHandle className='sheet-handle' />
                <view className='surface-body'>
                  <view className='surface-controls'>
                    <Button
                      className='surface-action'
                      onClick={() => sheetRef.current?.collapse()}
                    >
                      <text className='surface-action-text'>45%</text>
                    </Button>
                    <Button
                      className='surface-action'
                      onClick={() => sheetRef.current?.snapTo(1)}
                    >
                      <text className='surface-action-text'>70%</text>
                    </Button>
                    <Button
                      className='surface-action'
                      onClick={() => sheetRef.current?.expand()}
                    >
                      <text className='surface-action-text'>Fullscreen</text>
                    </Button>
                    <Button
                      className='surface-action'
                      onClick={() =>
                        sheetRef.current?.expand({ animate: false })}
                    >
                      <text className='surface-action-text'>
                        Instant fullscreen
                      </text>
                    </Button>
                    <Button
                      className='surface-action'
                      onClick={() => sheetRef.current?.close()}
                    >
                      <text className='surface-action-text'>Close</text>
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
