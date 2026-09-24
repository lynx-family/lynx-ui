// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ViewPager } from '@lynx-js/lynx-ui'
import type { ViewPagerOffsetChangeEvent } from '@lynx-js/lynx-ui'

import { pages } from './data'
import { PresentationCard } from './PresentationCard'
import './index.css'

function handleOffsetChangeMT(event: ViewPagerOffsetChangeEvent) {
  'main thread'

  const offset = event.detail.offset
  const index = Math.floor(offset)
  if (index < 0 || index >= pages.length - 1) return

  const progress = offset - index
  const height = pages[index].pagerHeight
    + progress
      * (pages[index + 1].pagerHeight - pages[index].pagerHeight)

  lynx
    .querySelector('#presentation-pager')
    ?.setStyleProperty('height', `${height}px`)
}

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <ViewPager
        data={pages}
        getItemKey={page => page.id}
        initialSelectIndex={0}
        className='view-pager'
        itemClassName='view-pager-item'
        id='presentation-pager'
        style={{ height: `${pages[0].pagerHeight}px` }}
        main-thread:onOffsetChange={handleOffsetChangeMT}
      >
        {page => <PresentationCard page={page} />}
      </ViewPager>
    </view>
  )
}

root.render(<App />)

export default App
