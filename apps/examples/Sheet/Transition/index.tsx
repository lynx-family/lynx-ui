// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  root,
  runOnBackground,
  runOnMainThread,
  useEffect,
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
  screenHeight,
  useSheetSurface,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef } from '@lynx-js/lynx-ui'

import { TriggerButton } from '../shared/index.js'
import { SurfaceRows } from '../shared/SurfaceRows.js'
import './index.css'

const FLOATING_FRAME = {
  insets: { left: 24, right: 24, bottom: 8 },
  maxWidth: 664,
}

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  const surface = useSheetSurface({ frame: FLOATING_FRAME, cornerRadius: 24 })
  const surfaceControllerRef = surface.controllerRef
  const [panel, setPanel] = useState({ fullscreen: false, animated: false })
  const panelTarget = useMainThreadRef({ fullscreen: false, animated: false })
  const [fullscreenHeight, setFullscreenHeight] = useState(screenHeight)

  function applyPanelSurface(fullscreen: boolean) {
    'main thread'
    surfaceControllerRef.current?.setFrame(
      fullscreen
        ? { insets: { bottom: 0 } }
        : FLOATING_FRAME,
    )
    surfaceControllerRef.current?.setCornerRadius(fullscreen ? 0 : 24)
  }

  function updatePanel(fullscreen: boolean, animated: boolean) {
    setPanel({ fullscreen, animated })
  }

  function resetPanelTarget() {
    'main thread'
    panelTarget.current = { fullscreen: false, animated: false }
    applyPanelSurface(false)
  }

  function onSnapStart(_index: number, value: number, animated: boolean) {
    'main thread'
    // Fullscreen is a product policy, not the index of the largest snap point.
    const fullscreen = value >= fullscreenHeight
    const previous = panelTarget.current
    if (previous.fullscreen === fullscreen && previous.animated === animated) {
      return
    }
    panelTarget.current = { fullscreen, animated }
    runOnBackground(updatePanel)(fullscreen, animated)
  }

  useEffect(() => {
    runOnMainThread(applyPanelSurface)(panel.fullscreen)
  }, [panel])

  return (
    <view
      className='demo-container surface-stage lunaris-dark'
      bindlayoutchange={event => {
        if (event.detail.height > 0) setFullscreenHeight(event.detail.height)
      }}
    >
      <view className='surface-launcher'>
        <text className='surface-title'>Room to read</text>
        <text className='surface-copy'>
          Release at fullscreen to widen the panel. Text keeps its natural size.
        </text>
        <TriggerButton
          text='Open reader'
          onClick={() => {
            runOnMainThread(resetPanelTarget)()
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
            surface={surface}
            className='sheet-content'
            innerClassName='surface-layout'
            style={{
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
