// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  PopoverArrow,
  PopoverBackdrop,
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@lynx-js/lynx-ui'

import './style.css'

function App() {
  const [internalVisibleControlled, setInternalVisibleControlled] = useState(
    true,
  )

  return (
    <view className='container'>
      <PopoverRoot
        show={internalVisibleControlled}
        onVisibleChange={(visible: boolean) => {
          setInternalVisibleControlled(visible)
        }}
      >
        <PopoverTrigger className='trigger controlled'>
          <text style={{ lineHeight: '20px' }}>
            Click me to show Popover & Click anywhere to close it
          </text>
          <PopoverPositioner
            placement='top'
            placementOffset={5}
          >
            <>
              <PopoverBackdrop />
              <PopoverContent
                transition={true}
                className='popover-content'
              >
                <text style={{ wordBreak: 'normal' }}>
                  Popover Content
                </text>
                <PopoverArrow
                  size={10}
                  color='navajowhite'
                />
              </PopoverContent>
            </>
          </PopoverPositioner>
        </PopoverTrigger>
      </PopoverRoot>
    </view>
  )
}

root.render(<App />)

export default App
