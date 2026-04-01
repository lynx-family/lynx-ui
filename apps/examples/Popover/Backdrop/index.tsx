// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  PopoverBackdrop,
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@lynx-js/lynx-ui'

import { EllipsisIcon, OptionsMenu } from '../shared/index.js'
import './index.css'

function App() {
  const [internalVisible, setInternalVisible] = useState(true)

  return (
    <view className='container lunaris-dark'>
      <PopoverRoot
        show={internalVisible}
        onVisibleChange={visible => setInternalVisible(visible)}
      >
        <PopoverTrigger className='popover-trigger'>
          <EllipsisIcon />
          <PopoverPositioner
            placement='bottom'
            placementOffset={12}
            autoAdjust='shift'
            className='popover-positioner'
          >
            {
              /*
              Workaround for issue #90: the default `fixed` PopoverBackdrop can stack above
              PopoverContent in this layout, so we use `position: absolute` and oversize
              with viewport units to keep the backdrop under the content while still
              covering the screen.
            */
            }
            <PopoverBackdrop
              className='popover-backdrop'
              style={{
                position: 'absolute',
                top: '-100vh',
                left: '-100vw',
                width: '300vw',
                height: '300vh',
              }}
            />
            <PopoverContent className='popover-content'>
              <OptionsMenu description='Moments persist. Actions are transient. Tap outside to close.' />
            </PopoverContent>
          </PopoverPositioner>
        </PopoverTrigger>
      </PopoverRoot>
    </view>
  )
}

root.render(<App />)

export default App
