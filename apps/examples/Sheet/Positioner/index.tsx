// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import {
  Button,
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetNestedScrollContent,
  SheetPositioner,
  SheetRoot,
  SheetView,
} from '@lynx-js/lynx-ui'
import type { SheetRootRef, SheetSide } from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  const sheetRef = useRef<SheetRootRef>(null)
  const [compact, setCompact] = useState(false)
  const [side, setSide] = useState<SheetSide>('bottom')
  const [nested, setNested] = useState(false)
  const [show, setShow] = useState(false)
  const [snapIndex, setSnapIndex] = useState(0)
  const width = compact ? 220 : 300
  const height = compact ? 320 : 480
  const snapValue = (side === 'top' || side === 'bottom' ? height : width)
    * (snapIndex === 0 ? 0.5 : 0.85)
  const sides: SheetSide[] = ['bottom', 'top', 'left', 'right', 'start', 'end']

  return (
    <view className='demo-container lunaris-dark'>
      <view className='controls'>
        <text className='size'>{`${width} × ${height}`}</text>
        <text className='caption'>
          {show ? `Snap: ${Math.round(snapValue)} px` : 'Local pane'}
        </text>
        <view className='actions'>
          <Button
            className='action'
            onClick={() => {
              setSnapIndex(0)
              setShow(true)
            }}
          >
            <text className='action-label'>Open</text>
          </Button>
          <Button
            className='action'
            onClick={() => setCompact(value => !value)}
          >
            <text className='action-label'>Resize</text>
          </Button>
          <Button
            className='action'
            disabled={show}
            onClick={() =>
              setSide(value =>
                sides[(sides.indexOf(value) + 1) % sides.length]
              )}
          >
            <text className='action-label'>{side}</text>
          </Button>
          <Button
            className='action'
            disabled={show}
            onClick={() => setNested(value => !value)}
          >
            <text className='action-label'>{nested ? 'Scroll' : 'Touch'}</text>
          </Button>
        </view>
      </view>
      <view
        className='pane'
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <text className='pane-label'>Host pane</text>
      </view>

      <SheetRoot
        ref={sheetRef}
        show={show}
        onShowChange={setShow}
        side={side}
        enableRTL={side === 'start' || side === 'end'}
        snapPoints={['50%', '85%']}
        onSnapChange={setSnapIndex}
      >
        <SheetView style={{ width: '100%', height: '100%' }}>
          <SheetPositioner
            width={width}
            height={height}
            style={{ left: '24px', top: '200px' }}
          >
            <SheetBackdrop className='backdrop' />
            {nested
              ? (
                <SheetNestedScrollContent className='surface' bottomInset={8}>
                  {({ scrollGesture }) => (
                    <scroll-view
                      className='scroll'
                      scroll-orientation={side === 'top' || side === 'bottom'
                        ? 'vertical'
                        : 'horizontal'}
                      main-thread:gesture={scrollGesture}
                      bounces={true}
                    >
                      {Array.from(
                        { length: 16 },
                        (_, index) => (
                          <view className='row' key={index}>
                            <text className='row-label'>
                              {`Item ${index + 1}`}
                            </text>
                          </view>
                        ),
                      )}
                    </scroll-view>
                  )}
                </SheetNestedScrollContent>
              )
              : (
                <SheetContent className='surface' bottomInset={8}>
                  <SheetHandle className='handle' />
                  <view className='panel'>
                    <text className='panel-label'>Local snap points</text>
                    <Button
                      className='action'
                      onClick={() => sheetRef.current?.expand()}
                    >
                      <text className='action-label'>Expand to 85%</text>
                    </Button>
                    <Button
                      className='action'
                      onClick={() => setCompact(value => !value)}
                    >
                      <text className='action-label'>Resize pane</text>
                    </Button>
                    <Button className='action' onClick={() => setShow(false)}>
                      <text className='action-label'>Close</text>
                    </Button>
                  </view>
                </SheetContent>
              )}
          </SheetPositioner>
        </SheetView>
      </SheetRoot>
    </view>
  )
}

root.render(<App />)
export default App
