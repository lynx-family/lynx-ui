// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  PopoverBackdrop,
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@lynx-js/lynx-ui'

import { EllipsisIcon, OptionsMenu } from '../../shared/index.js'
import './index.css'

function App() {
  return (
    <view className='container lunaris-dark'>
      {
        /*
        Known issue (Popover Backdrop in uncontrolled mode):
        - When PopoverBackdrop/PopoverPositioner are nested inside PopoverTrigger, tapping the backdrop can bubble to the trigger.
        - Uncontrolled (`defaultShow`) may end up toggling twice (close then re-open), so the popover doesn't close cleanly.
        - Observed: iOS cannot close via backdrop; Android may close-open-close.
        Workaround: use controlled mode (`show` + `onVisibleChange`) until the upstream fix lands.
        Tracking issue: lynx-family/lynx-ui#84
      */
      }
      <PopoverRoot defaultShow={true}>
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
              NOTE (PopoverBackdrop stacking/sizing in Lynx):
              - PopoverBackdrop uses `position: fixed` by default, which creates a new stacking context.
              - This example needs the backdrop under the popover content, so we override it to `position: absolute`.
              - We use `top/left/width/height` with viewport units so the backdrop can cover the visual viewport even
                though it is positioned relative to the PopoverPositioner.
              - As a pragmatic hack, we oversize the backdrop (e.g. `300vw/300vh` with negative offsets) so it stays
                over the whole viewport; this does rely on an arbitrary scale that is "large enough" for typical viewports.
              TODO: Move this behavior into PopoverBackdrop (absolute positioning + viewport-based size) so consumers don't need overrides.
              Tracking issue: lynx-family/lynx-ui#90
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
