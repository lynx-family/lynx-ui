// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Button, DeferredComponent } from '@lynx-js/lynx-ui'

import '../shared/base.css'

/** Creates a larger subtree so the example can demonstrate deferred mounting. */
function Content() {
  return (
    <view className='deferred-demo-content'>
      <text className='deferred-demo-label'>Content mounted</text>
      <view className='deferred-demo-cells'>
        {Array.from(
          { length: 300 },
          (_, index) => (
            <view key={index} flatten={false} className='deferred-demo-cell' />
          ),
        )}
      </view>
    </view>
  )
}

/** Compares one-frame deferral with immediate rendering and allows replaying both. */
function App() {
  const [visible, setVisible] = useState(false)

  return (
    <view className='deferred-demo-page lunaris-dark'>
      <text className='deferred-demo-title'>Deferred content</text>
      <text className='deferred-demo-description'>
        Show both panels to compare the default one-frame delay with immediate
        rendering. Hide and show them to replay.
      </text>
      <Button
        className='deferred-demo-button'
        onClick={() => setVisible((value) => !value)}
      >
        <text className='deferred-demo-button-label'>
          {visible ? 'Hide content' : 'Show content'}
        </text>
      </Button>
      <view className='deferred-demo-panel'>
        <text className='deferred-demo-label'>Default: one frame</text>
        <view className='deferred-demo-preview'>
          {visible && (
            <DeferredComponent
              estimatedStyle={{ width: '100%', height: '160px' }}
              placeholder={
                <view className='deferred-demo-placeholder'>
                  <text className='deferred-demo-description'>
                    Waiting for the first layout
                  </text>
                </view>
              }
            >
              <Content />
            </DeferredComponent>
          )}
        </view>
      </view>
      <view className='deferred-demo-panel'>
        <text className='deferred-demo-label'>Immediate: zero frames</text>
        <view className='deferred-demo-preview'>
          {visible && (
            <DeferredComponent delayFrames={0}>
              <Content />
            </DeferredComponent>
          )}
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
