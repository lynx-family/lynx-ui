// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useState } from '@lynx-js/react'

import {
  PopoverAnchor,
  PopoverArrow,
  PopoverBackdrop,
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
} from '@lynx-js/lynx-ui'

import './style.css'

function App() {
  const [internalVisibleControlled, setInternalVisibleControlled] = useState(
    false,
  )
  const flipDuration = 2000

  useEffect(() => {
    const timer = setInterval(() => {
      setInternalVisibleControlled(pre => !pre)
    }, flipDuration)
    return () => {
      clearInterval(timer)
    }
  }, [])

  const handleHandleClickControlled = (): void => {
    setInternalVisibleControlled(false)
  }

  return (
    <view className='container'>
      <PopoverRoot
        show={internalVisibleControlled}
        onVisibleChange={setInternalVisibleControlled}
      >
        <PopoverAnchor className='trigger controlled'>
          <text>
            Visible changed to {internalVisibleControlled ? 'true' : 'false'}
            {' '}
            in every {flipDuration}ms
          </text>
          <PopoverPositioner
            placement='top'
            placementOffset={5}
          >
            <>
              <PopoverBackdrop className='popover-backdrop' />
              <PopoverContent
                transition={true}
                className='popover-content'
                popoverContentProps={{ catchtap: handleHandleClickControlled }}
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
        </PopoverAnchor>
      </PopoverRoot>
    </view>
  )
}

root.render(<App />)

export default App
