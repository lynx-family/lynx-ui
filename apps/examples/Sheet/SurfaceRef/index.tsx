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
import type { SheetRootRef } from '@lynx-js/lynx-ui'
import {
  animate,
  useMotionValueRef,
  useMotionValueRefEvent,
} from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import { TriggerButton } from '../shared/index.js'
import './index.css'

function App() {
  const sheet = useRef<SheetRootRef>(null)
  const surface = useMainThreadRef<MainThread.Element | null>(null)
  const [viewport, setViewport] = useState({
    width: screenWidth,
    height: screenHeight,
  })
  const floatingWidth = Math.min(Math.max(0, viewport.width - 48), 664)
  const fullscreenWidth = viewport.width
  const fullscreenHeight = viewport.height
  const width = useMotionValueRef(floatingWidth)
  const target = useMainThreadRef({ width: floatingWidth, animated: false })

  useMotionValueRefEvent(width, 'change', value => {
    'main thread'
    surface.current?.setStyleProperties({ width: `${value}px` })
  })

  function resetWidth() {
    'main thread'
    target.current = { width: floatingWidth, animated: false }
    width.current.jump(floatingWidth)
  }

  function onSnapStart(_index: number, size: number, animated: boolean) {
    'main thread'
    const next = size >= fullscreenHeight ? fullscreenWidth : floatingWidth
    const previous = target.current
    if (previous.width === next && previous.animated === animated) return
    target.current = { width: next, animated }
    width.current.stop()
    if (animated) {
      animate(width.current, next, {
        type: 'spring',
        stiffness: 260,
        damping: 28,
      })
    } else {
      width.current.jump(next)
    }
  }

  useEffect(() => () => {
    runOnMainThread(() => {
      'main thread'
      width.current?.stop()
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
        screenHeight={fullscreenHeight}
        main-thread:onSnapStart={onSnapStart}
      >
        <SheetView className='sheet-viewport'>
          <SheetBackdrop className='sheet-overlay' />
          <SheetContent
            main-thread:surfaceRef={surface}
            className='sheet-content'
            innerClassName='surface-layout'
            style={{ alignSelf: 'center', width: `${floatingWidth}px` }}
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
