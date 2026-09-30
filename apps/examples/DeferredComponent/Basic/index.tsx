// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Button, DeferredComponent } from '@lynx-js/lynx-ui'

import { ComparisonPanel, DeferredPlaceholder, MountedContent } from './Preview'
import '../shared/base.css'

/** Compares one-frame deferral with immediate rendering. */
function App() {
  const [visible, setVisible] = useState(true)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='canvas'>
        <view className='header'>
          <text className='title'>Deferred mount</text>
          <text className='description'>
            Compare the default delay with immediate rendering.
          </text>
        </view>
        <Button
          className='action-button'
          onClick={() => setVisible((value) => !value)}
        >
          <text className='action-button-label'>
            {visible ? 'Hide content' : 'Show content'}
          </text>
        </Button>
        <view className='comparison'>
          <ComparisonPanel label='Default' meta='1 frame'>
            {visible && (
              <DeferredComponent
                estimatedStyle={{ width: '100%', height: '100%' }}
                placeholder={<DeferredPlaceholder />}
              >
                <MountedContent />
              </DeferredComponent>
            )}
          </ComparisonPanel>

          <ComparisonPanel label='Immediate' meta='0 frames'>
            {visible && (
              <DeferredComponent delayFrames={0}>
                <MountedContent />
              </DeferredComponent>
            )}
          </ComparisonPanel>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
