// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Button, DeferredComponent } from '@lynx-js/lynx-ui'

import { DelayPlaceholder, PreviewPanel, ResizableContent } from './Preview'
import '../shared/base.css'

/** Demonstrates a visible placeholder delay and layout callbacks after resizing. */
function App() {
  const [revision, setRevision] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [layout, setLayout] = useState('120 px estimate')

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='canvas canvas-compact'>
        <view className='header'>
          <text className='title'>Frame delay</text>
          <text className='description'>
            The placeholder remains visible for 30 frames.
          </text>
        </view>
        <Button
          className='action-button'
          onClick={() => {
            setLayout('120 px estimate')
            setExpanded(false)
            setRevision((value) => value + 1)
          }}
        >
          <text className='action-button-label'>Replay delay</text>
        </Button>
        <PreviewPanel meta={layout}>
          <DeferredComponent
            key={revision}
            delayFrames={30}
            estimatedStyle={{ width: '100%', minHeight: '120px' }}
            placeholder={<DelayPlaceholder />}
            onLayoutChange={({ width, height }) => {
              setLayout(
                `Content layout: ${Math.round(width)} × ${
                  Math.round(height)
                } px`,
              )
            }}
          >
            <ResizableContent expanded={expanded}>
              <Button
                className='action-button'
                onClick={() => setExpanded((value) => !value)}
              >
                <text className='action-button-label'>
                  {expanded ? 'Collapse content' : 'Expand content'}
                </text>
              </Button>
            </ResizableContent>
          </DeferredComponent>
        </PreviewPanel>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
