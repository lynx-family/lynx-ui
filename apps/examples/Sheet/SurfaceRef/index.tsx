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

const FLOATING_FRAME = {
  insets: { left: 24, right: 24 },
  maxWidth: 664,
}

function App() {
  const sheet = useRef<SheetRootRef>(null)
  const surfaceController = useMainThreadRef<SheetSurfaceController | null>(
    null,
  )
  const [viewport, setViewport] = useState({
    width: screenWidth,
    height: screenHeight,
  })
  const fullscreenHeight = viewport.height
  const progress = useMotionValueRef(0)
  const target = useMainThreadRef({ value: 0, animated: false })

  useMotionValueRefEvent(progress, 'change', value => {
    'main thread'
    const surface = surfaceController.current
    if (!surface) return
    const { width: viewportWidth } = surface.getViewportSize()
    const startWidth = Math.min(Math.max(0, viewportWidth - 48), 664)
    const amount = Math.max(0, Math.min(1, value))
    surface.setFrame({
      width: startWidth + (viewportWidth - startWidth) * amount,
    })
  })

  function resetWidth() {
    'main thread'
    target.current = { value: 0, animated: false }
    progress.current.jump(0)
    surfaceController.current?.setFrame(FLOATING_FRAME)
  }

  function onDragStart() {
    'main thread'
    progress.current.stop()
  }

  function onSnapStart(_index: number, size: number, animated: boolean) {
    'main thread'
    const next = size >= fullscreenHeight ? 1 : 0
    const previous = target.current
    if (previous.value === next && previous.animated === animated) return
    target.current = { value: next, animated }
    progress.current.stop()
    if (animated) {
      animate(progress.current, next, {
        type: 'spring',
        stiffness: 260,
        damping: 28,
      })
    } else {
      progress.current.jump(next)
    }
  }

  useEffect(() => () => {
    runOnMainThread(() => {
      'main thread'
      progress.current?.stop()
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
            initialFrame={FLOATING_FRAME}
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
