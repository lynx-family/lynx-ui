// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  PopoverArrow,
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@lynx-js/lynx-ui-popover'
import type { PresenceAnimationStatus } from '@lynx-js/lynx-ui-popover'
import { clsx } from 'clsx'
import './index.css'

function App() {
  return (
    <view className='container'>
      <PopoverRoot
        onClose={() => console.info('dismissed!!!!')}
        onOpen={() => console.info('shown!!!! ')}
      >
        <PopoverTrigger className='trigger'>
          <text>Click me to show Popover</text>
          <PopoverPositioner
            placement='right'
            placementOffset={5}
            className='popover-positioner'
          >
            {(
              { entering = false, leaving = false }: PresenceAnimationStatus,
            ) => {
              return (
                <PopoverContent
                  className={clsx(
                    'popover-content',
                    {
                      'fade-enlarge': entering,
                      'fade-shrink': leaving,
                    },
                  )}
                >
                  <text style={{ wordBreak: 'normal' }}>
                    Popover Content
                  </text>
                  <PopoverArrow
                    size={{ width: 20, height: 30 }}
                    color='NavajoWhite'
                  >
                    <view
                      style={{
                        width: '20px',
                        height: '30px',
                        background:
                          'linear-gradient(180deg, red 0%, PeachPuff 100%)',
                      }}
                    >
                    </view>
                  </PopoverArrow>
                </PopoverContent>
              )
            }}
          </PopoverPositioner>
        </PopoverTrigger>
      </PopoverRoot>
    </view>
  )
}

root.render(<App />)

export default App
