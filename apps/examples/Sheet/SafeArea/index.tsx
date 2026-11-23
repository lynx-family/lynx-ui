// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  root,
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
import type { SheetRootRef, SheetSurfaceController } from '@lynx-js/lynx-ui'
import {
  animate,
  useMotionValueRef,
  useMotionValueRefEvent,
} from '@lynx-js/motion/mini'

import { SurfaceRows } from '../shared/SurfaceRows.js'
import './index.css'

// These fixed viewport boundaries stay unchanged as the panel moves and widens.
const viewportInsets = { top: 64, right: 84 }

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  const surfaceControllerRef = useMainThreadRef<SheetSurfaceController | null>(
    null,
  )
  const [show, setShow] = useState(true)
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
  const floatingSideInset = Math.max(0, (viewport.width - floatingWidth) / 2)
  const progress = useMotionValueRef(0)
  const fullscreenTarget = useMainThreadRef(false)

  function applyAppearance(value: number, animating = false) {
    'main thread'
    const amount = Math.max(0, Math.min(1, value))
    const sideInset = floatingSideInset * (1 - amount)
    const bottomInset = 8 * (1 - amount)
    const radius = 24 * (1 - amount)
    surfaceControllerRef.current?.setInsets(
      {
        left: sideInset,
        right: sideInset,
        bottom: bottomInset,
      },
      animating ? { animating: true } : undefined,
    )
    surfaceControllerRef.current?.setCornerRadius(radius)
  }

  useMotionValueRefEvent(progress, 'change', value => {
    'main thread'
    applyAppearance(value, progress.current.isAnimating())
  })

  function resetAppearance() {
    'main thread'
    fullscreenTarget.current = false
    progress.current.jump(0)
    applyAppearance(0)
  }

  function onDragStart() {
    'main thread'
    progress.current.stop()
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
    progress.current.stop()
    if (animated) {
      animate(progress.current, target, {
        type: 'spring',
        stiffness: 260,
        damping: 28,
        onComplete: () => {
          'main thread'
          applyAppearance(target)
        },
      })
    } else {
      progress.current.jump(target)
      applyAppearance(target)
    }
  }

  useEffect(() => {
    runOnMainThread(() => {
      'main thread'
      if (!progress.current.isAnimating()) {
        applyAppearance(progress.current.get())
      }
    })()
  }, [floatingSideInset])

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
        snapPoints={['45%', '100%']}
        main-thread:onDragStart={onDragStart}
        main-thread:onSnapStart={onSnapStart}
      >
        <SheetView className='sheet-viewport'>
          <SheetPositioner>
            <SheetBackdrop className='sheet-backdrop' />
            <SheetNestedScrollContent
              main-thread:surfaceControllerRef={surfaceControllerRef}
              className='sheet-surface'
              innerClassName='sheet-layout'
              initialCornerRadius={24}
              initialInsets={{
                left: floatingSideInset,
                right: floatingSideInset,
                bottom: 8,
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
