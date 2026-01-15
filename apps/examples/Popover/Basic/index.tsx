// Popover/index.tsx
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@lynx-js/lynx-ui-popover'

import './index.css'

function App() {
  return (
    <view className='container lunaris-dark'>
      <PopoverRoot
        onClose={() => console.info('dismissed!')}
        onOpen={() => console.info('shown!')}
      >
        <PopoverTrigger className='popover-trigger'>
          <text className='popover-trigger-text'>Show Popover</text>

          <PopoverPositioner
            placement='bottom-end'
            placementOffset={12}
            autoAdjust='shift'
            className='popover-positioner'
          >
            <PopoverContent className='popover-content'>
              <text className='popover-title'>Popover Content</text>
              <text className='popover-desc'>
                A temporary floating container used to display contextual
                information or lightweight actions without interrupting the
                current flow.
              </text>
            </PopoverContent>
          </PopoverPositioner>
        </PopoverTrigger>
      </PopoverRoot>
    </view>
  )
}

root.render(<App />)

export default App
