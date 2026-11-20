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
  SheetContent,
  SheetHandle,
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

import { TriggerButton } from '../shared/index.js'
import './index.css'

function App() {
  const sheet = useRef<SheetRootRef>(null)
  const surfaceController = useMainThreadRef<SheetSurfaceController | null>(
    null,
  )
  const [viewport, setViewport] = useState({
    width: screenWidth,
    height: screenHeight,
  })
  const floatingWidth = Math.min(Math.max(0, viewport.width - 48), 664)
  const floatingSideInset = Math.max(0, (viewport.width - floatingWidth) / 2)
  const fullscreenHeight = viewport.height
  const sideInset = useMotionValueRef(floatingSideInset)
  const target = useMainThreadRef({ inset: floatingSideInset, animated: false })

  useMotionValueRefEvent(sideInset, 'change', value => {
    'main thread'
    surfaceController.current?.setInsets({ left: value, right: value })
  })

  function resetWidth() {
    'main thread'
    target.current = { inset: floatingSideInset, animated: false }
    sideInset.current.jump(floatingSideInset)
  }

  function onDragStart() {
    'main thread'
    sideInset.current.stop()
  }

  function onSnapStart(_index: number, size: number, animated: boolean) {
    'main thread'
    const next = size >= fullscreenHeight ? 0 : floatingSideInset
    const previous = target.current
    if (previous.inset === next && previous.animated === animated) return
    target.current = { inset: next, animated }
    sideInset.current.stop()
    if (animated) {
      animate(sideInset.current, next, {
        type: 'spring',
        stiffness: 260,
        damping: 28,
      })
    } else {
      sideInset.current.jump(next)
    }
  }

  useEffect(() => () => {
    runOnMainThread(() => {
      'main thread'
      sideInset.current?.stop()
    })()
  }, [])

  return (
    <view
      className='demo-container surface-stage lunaris-dark'
      bindlayoutchange={event =>
        setViewport({ width: event.detail.width, height: event.detail.height })}
    >
      <view className='surface-launcher'>
        <text className='surface-title'>A custom width spring</text>
        <TriggerButton
          text='Open panel'
          onClick={() => {
            runOnMainThread(resetWidth)()
            sheet.current?.open()
          }}
        />
      </view>
      <SheetRoot
        ref={sheet}
        snapPoints={['45%', '100%']}
        screenWidth={viewport.width}
        screenHeight={fullscreenHeight}
        main-thread:onDragStart={onDragStart}
        main-thread:onSnapStart={onSnapStart}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetContent
            main-thread:surfaceControllerRef={surfaceController}
            insets={{ left: floatingSideInset, right: floatingSideInset }}
            className='sheet-content'
            innerClassName='surface-layout'
          >
            <SheetHandle className='sheet-handle' />
            <view className='surface-body'>
              <view className='surface-controls'>
                <Button
                  className='surface-action'
                  onClick={() => sheet.current?.collapse()}
                >
                  <text className='surface-action-text'>Collapse</text>
                </Button>
                <Button
                  className='surface-action'
                  onClick={() => sheet.current?.expand()}
                >
                  <text className='surface-action-text'>Fullscreen</text>
                </Button>
                <Button
                  className='surface-action'
                  onClick={() => sheet.current?.close()}
                >
                  <text className='surface-action-text'>Close</text>
                </Button>
              </view>
              <text className='surface-copy'>
                The panel widens around its center. Text wraps as the width
                changes.
              </text>
            </view>
          </SheetContent>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)
export default App
