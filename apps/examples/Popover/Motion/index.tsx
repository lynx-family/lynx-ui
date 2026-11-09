// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  PopoverArrow,
  PopoverMotionContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@lynx-js/lynx-ui'

import './index.css'

const spring = { type: 'spring', stiffness: 600, damping: 36 } as const
const exit = { type: 'tween', duration: 0.2, ease: 'easeIn' } as const

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <PopoverRoot>
        <PopoverTrigger className='popover-trigger'>
          <text className='popover-trigger-text'>?</text>
          <PopoverPositioner
            className='motion-positioner'
            placement='top'
            placementOffset={8}
          >
            <PopoverMotionContent
              className='motion-content'
              motion={{
                initial: { opacity: 0, scale: 0.6 },
                open: { opacity: 1, scale: 1, transition: spring },
                close: { opacity: 0, scale: 0.6, transition: exit },
              }}
            >
              <text className='motion-text'>A little more detail.</text>
              <PopoverArrow size={8} />
            </PopoverMotionContent>
          </PopoverPositioner>
        </PopoverTrigger>
      </PopoverRoot>
    </view>
  )
}

root.render(<App />)

export default App
