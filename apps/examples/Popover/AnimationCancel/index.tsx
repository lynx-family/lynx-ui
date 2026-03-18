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
  const [show, setShow] = useState(false)
  const [animationClass, setAnimationClass] = useState('popover-content')

  const handleStartTest = () => {
    // 1. Show the popover (starts entering animation)
    setShow(true)
    setAnimationClass('popover-content')

    // 2. Force animation cancel by changing animation class during animation
    setTimeout(() => {
      console.log('Changing animation class to trigger animation cancel')
      setAnimationClass('popover-content-alt')

      // 3. After a while, try to close popover
      setTimeout(() => {
        console.log('Now try to close popover')
        setShow(false)
      }, 1000)
    }, 300) // Trigger mid-animation (assuming 300ms duration)
  }

  return (
    <view className='container'>
      <view bindtap={handleStartTest} className='test-btn'>
        <text>Start Cancel Test (Change Animation)</text>
      </view>

      <view className='wrapper'>
        <PopoverRoot
          show={show}
          onVisibleChange={setShow}
          debugLog={true}
        >
          <PopoverTrigger className='trigger'>
            <text>Trigger</text>
            <PopoverPositioner
              placement='bottom'
              placementOffset={5}
            >
              <>
                <PopoverBackdrop className='popover-backdrop' />
                <PopoverContent
                  transition={true}
                  className={animationClass}
                >
                  <text>Content</text>
                  <PopoverArrow size={10} color='navajowhite' />
                </PopoverContent>
              </>
            </PopoverPositioner>
          </PopoverTrigger>
        </PopoverRoot>
      </view>

      <text style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
        Scenario: Change animation class during enter animation -&gt; triggers
        cancel. If bug exists: State might stall in Entering/Leaving because
        cancel didn't trigger completion logic.
      </text>
    </view>
  )
}

root.render(<App />)

export default App
