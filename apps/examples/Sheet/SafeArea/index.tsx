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
  useSheetSurface,
} from '@lynx-js/lynx-ui'
import type {
  SheetPresenceState,
  SheetRootRef,
  SheetSurfaceFrame,
} from '@lynx-js/lynx-ui'
import {
  animate,
  useMotionValueRef,
  useMotionValueRefEvent,
} from '@lynx-js/motion/mini'

import { SurfaceRows } from '../shared/SurfaceRows.js'
import './index.css'

// These fixed viewport boundaries stay unchanged as the panel moves and widens.
const viewportInsets = { top: 64, right: 84 }
const FLOATING_FRAME: SheetSurfaceFrame = {
  insets: { bottom: 8 },
  width: '50%',
  maxWidth: 664,
}

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  const surface = useSheetSurface({ frame: FLOATING_FRAME, cornerRadius: 24 })
  const surfaceControllerRef = surface.controllerRef
  const [show, setShow] = useState(true)
  const progress = useMotionValueRef(0)
  const fullscreenTarget = useMainThreadRef(false)
  const presenceState = useMainThreadRef<SheetPresenceState>('entered')
  const resurrectCandidate = useMainThreadRef(false)

  function applyAppearance(value: number, animating = false) {
    'main thread'
    const surface = surfaceControllerRef.current
    if (!surface) return
    const amount = Math.max(0, Math.min(1, value))
    const radius = 24 * (1 - amount)
    if (!animating && (amount === 0 || amount === 1)) {
      surface.setFrame(
        amount === 1 ? { insets: { bottom: 0 } } : FLOATING_FRAME,
      )
      surface.setCornerRadius(radius)
    } else {
      const { width: viewportWidth } = surface.getViewportSize()
      const startWidth = Math.min(664, viewportWidth * 0.5)
      surface.setFrame(
        {
          insets: { bottom: 8 * (1 - amount) },
          width: startWidth + (viewportWidth - startWidth) * amount,
        },
        animating ? { animating: true } : undefined,
      )
      surface.setCornerRadius(radius)
    }
  }

  useMotionValueRefEvent(progress, 'change', value => {
    'main thread'
    applyAppearance(value, progress.current.isAnimating())
  })

  function onPresenceChange(state: SheetPresenceState) {
    'main thread'
    const previous = presenceState.current
    presenceState.current = state
    if (state === 'entering') {
      progress.current.stop()
      if (previous === 'exiting') {
        resurrectCandidate.current = true
        requestAnimationFrame(() => {
          'main thread'
          if (!resurrectCandidate.current) return
          resurrectCandidate.current = false
          fullscreenTarget.current = false
          progress.current.jump(0)
          applyAppearance(0)
        })
        return
      }
      resurrectCandidate.current = false
      fullscreenTarget.current = false
      progress.current.jump(0)
      applyAppearance(0)
    } else {
      resurrectCandidate.current = false
      if (state === 'exiting') {
        progress.current.stop()
      }
    }
  }

  function onDragStart() {
    'main thread'
    resurrectCandidate.current = false
    progress.current.stop()
  }

  function onSnapStart(_index: number, value: number, animated: boolean) {
    'main thread'
    resurrectCandidate.current = false
    const fullscreenHeight =
      surfaceControllerRef.current?.getViewportSize().height ?? 0
    const nextFullscreen = fullscreenHeight > 0 && value >= fullscreenHeight
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

  useEffect(() => () => {
    runOnMainThread(() => {
      'main thread'
      progress.current?.stop()
    })()
  }, [])

  return (
    <view className='demo-container luna-light'>
      <view className='launcher'>
        <text className='title'>Room for the content</text>
        <text className='description'>
          Drag up, then release: the panel widens while content stays inside the
          top and right guides.
        </text>
        <Button
          className='action'
          onClick={() => {
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
        main-thread:onPresenceChange={onPresenceChange}
        main-thread:onDragStart={onDragStart}
        main-thread:onSnapStart={onSnapStart}
      >
        <SheetView className='sheet-viewport'>
          <SheetPositioner>
            <SheetBackdrop className='sheet-backdrop' />
            <SheetNestedScrollContent
              surface={surface}
              className='sheet-surface'
              innerClassName='sheet-layout'
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
