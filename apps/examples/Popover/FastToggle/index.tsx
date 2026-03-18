// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useState } from '@lynx-js/react'

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
    false,
  )
  const flipDuration = 10 // Trigger toggle in 10ms (less than 8 frames ~ 130ms)

  useEffect(() => {
    // Simulate rapid open -> close
    // This should reproduce the issue where mount remains true if closed before Entering starts
    const timer = setTimeout(() => {
      console.log('Toggling ON')
      setInternalVisibleControlled(true)

      setTimeout(() => {
        console.log('Toggling OFF rapidly')
        setInternalVisibleControlled(false)
      }, flipDuration)
    }, 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  return (
    <view className='container'>
      <PopoverRoot
        show={internalVisibleControlled}
        onVisibleChange={setInternalVisibleControlled}
        debugLog={true} // Enable debug log to observe state transitions
      >
        <PopoverTrigger className='trigger controlled'>
          <text>
            Fast Toggle Test (10ms)
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

      <text style={{ marginTop: 20 }}>
        Status: {internalVisibleControlled ? 'Visible' : 'Hidden'}
      </text>
      <text style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
        Check console logs for [lynx-ui-presence] messages. If bug exists: mount
        stays true after toggle off.
      </text>
    </view>
  )
}

root.render(<App />)

export default App
