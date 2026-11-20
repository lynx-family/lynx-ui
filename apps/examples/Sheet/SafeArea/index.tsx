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
import {
  animate,
  useMotionValueRef,
  useMotionValueRefEvent,
} from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import { SurfaceRows } from '../shared/SurfaceRows.js'
import './index.css'

// These fixed viewport boundaries stay unchanged as the panel moves and widens.
const viewportInsets = { top: 64, right: 84 }

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  const surfaceRef = useMainThreadRef<MainThread.Element | null>(null)
  const [show, setShow] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [viewport, setViewport] = useState({
    width: screenWidth,
    height: screenHeight,
  })
  const fullscreenHeight = viewport.height
  const floatingWidth = Math.min(
    viewport.width,
    664,
    Math.max(192, viewport.width - 256),
  )
  const progress = useMotionValueRef(0)
  const fullscreenTarget = useMainThreadRef(false)

  function applyAppearance(value: number) {
    'main thread'
    const amount = Math.max(0, Math.min(1, value))
    const width = floatingWidth + (viewport.width - floatingWidth) * amount
    surfaceRef.current?.setStyleProperties({
      width: `${width}px`,
      left: `${(viewport.width - width) / 2}px`,
    })
  }

  useMotionValueRefEvent(progress, 'change', applyAppearance)

  function resetAppearance() {
    'main thread'
    fullscreenTarget.current = false
    progress.current.jump(0)
    applyAppearance(0)
  }

  function onSnapStart(_index: number, value: number, animated: boolean) {
    'main thread'
    const nextFullscreen = value >= fullscreenHeight
    const target = nextFullscreen ? 1 : 0
    if (
      fullscreenTarget.current === nextFullscreen
      && (progress.current.isAnimating() || progress.current.get() === target)
    ) return
    fullscreenTarget.current = nextFullscreen
    runOnBackground(setFullscreen)(nextFullscreen)
    progress.current.stop()
    if (animated) {
      // Appearance has its own spring; Sheet still owns vertical movement.
      animate(progress.current, target, {
        type: 'spring',
        stiffness: 260,
        damping: 28,
      })
    } else {
      progress.current.jump(target)
    }
  }

  // Recompute width on a viewport resize. Snap motion owns width between resizes.
  useEffect(() => {
    runOnMainThread(() => {
      'main thread'
      applyAppearance(progress.current.get())
    })()
  }, [floatingWidth, viewport.width])

  useEffect(() => () => {
    runOnMainThread(() => {
      'main thread'
      progress.current?.stop()
    })()
  }, [])

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
          Drag up, then release: the panel widens while content stays inside the
          top and right guides.
        </text>
        <Button
          className='action'
          onClick={() => {
            runOnMainThread(resetAppearance)()
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
              main-thread:surfaceRef={surfaceRef}
              className='sheet-surface'
              innerClassName='sheet-layout'
              cornerRadius={fullscreen ? 0 : 24}
              panelLayout={{ bottomGap: fullscreen ? 0 : 8 }}
              style={{
                width: `${floatingWidth}px`,
                left: `${(viewport.width - floatingWidth) / 2}px`,
              }}
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
                      <text className='reader-title'>Reader</text>
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
                      event-through={false}
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
                bottom: 0,
                left: 0,
              }}
              native-interaction-enabled={false}
              user-interaction-enabled={false}
            />
          </SheetPositioner>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)
export default App
