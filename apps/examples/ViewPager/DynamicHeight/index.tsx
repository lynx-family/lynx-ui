// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ViewPager } from '@lynx-js/lynx-ui'
import type { ViewPagerOffsetChangeEvent } from '@lynx-js/lynx-ui'

import { pages } from './data'
import './index.css'

function handleOffsetChangeMT(event: ViewPagerOffsetChangeEvent) {
  'main thread'

  const offset = event.detail.offset
  const index = Math.floor(offset)
  if (index < 0 || index >= pages.length - 1) return

  const progress = offset - index
  const height = pages[index].height
    + progress * (pages[index + 1].height - pages[index].height)

  lynx
    .querySelector('#dynamic-height-pager')
    ?.setStyleProperty('height', `${height}px`)
}

function App() {
  return (
    <view className='demo-container lunaris-dark luna-gradient-afterglow'>
      <ViewPager
        data={pages}
        getItemKey={page => page.id}
        className='view-pager'
        itemClassName='view-pager-item'
        id='dynamic-height-pager'
        style={{ height: `${pages[0].height}px` }}
        main-thread:onOffsetChange={handleOffsetChangeMT}
      >
        {(page, index) => (
          <view
            className='card'
            style={{ height: `${page.height}px` }}
          >
            <text className='number'>
              0{index + 1}
            </text>
            <text className='height'>
              {page.height}px
            </text>
          </view>
        )}
      </ViewPager>
    </view>
  )
}

root.render(<App />)

export default App
