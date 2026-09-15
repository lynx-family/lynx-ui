// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Button, DeferredComponent } from '@lynx-js/lynx-ui'

import '../shared/base.css'

/** Demonstrates a visible placeholder delay and layout callbacks after resizing. */
function App() {
  const [revision, setRevision] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [layout, setLayout] = useState('Waiting for content layout')

  return (
    <view className='deferred-demo-page lunaris-dark'>
      <text className='deferred-demo-title'>Placeholder and layout</text>
      <text className='deferred-demo-description'>
        A 30-frame delay makes the placeholder easier to see. Resize the content
        after it appears to receive its new layout dimensions.
      </text>
      <Button
        className='deferred-demo-button'
        onClick={() => {
          setLayout('Waiting for content layout')
          setExpanded(false)
          setRevision((value) => value + 1)
        }}
      >
        <text className='deferred-demo-button-label'>Replay delay</text>
      </Button>
      <text className='deferred-demo-description'>{layout}</text>
      <view className='deferred-demo-panel'>
        <DeferredComponent
          key={revision}
          delayFrames={30}
          estimatedStyle={{ width: '100%', minHeight: '120px' }}
          placeholder={
            <view className='deferred-demo-placeholder'>
              <text className='deferred-demo-description'>
                Preparing content…
              </text>
            </view>
          }
          onLayoutChange={({ width, height }) => {
            setLayout(
              `Content layout: ${Math.round(width)} × ${Math.round(height)} px`,
            )
          }}
        >
          <view
            className={expanded
              ? 'deferred-demo-content deferred-demo-content-expanded'
              : 'deferred-demo-content'}
          >
            <text className='deferred-demo-label'>Content mounted</text>
            <text className='deferred-demo-description'>
              The placeholder has been replaced by this content.
            </text>
            <Button
              className='deferred-demo-button'
              onClick={() => setExpanded((value) => !value)}
            >
              <text className='deferred-demo-button-label'>
                {expanded ? 'Collapse content' : 'Expand content'}
              </text>
            </Button>
          </view>
        </DeferredComponent>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
