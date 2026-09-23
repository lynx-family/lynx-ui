// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

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
  const height = pages[index].pagerHeight
    + progress
      * (pages[index + 1].pagerHeight - pages[index].pagerHeight)

  lynx
    .querySelector('#presentation-pager')
    ?.setStyleProperty('height', `${height}px`)
}

function App() {
  const [index, setIndex] = useState(0)

  return (
    <view className='view-pager-presentation lunaris-dark'>
      <view className='view-pager-presentation__header'>
        <text className='view-pager-presentation__eyebrow'>
          COMPONENT STUDY
        </text>
        <text className='view-pager-presentation__heading'>ViewPager</text>
      </view>
      <ViewPager
        data={pages}
        getItemKey={page => page.id}
        initialSelectIndex={0}
        className='view-pager-presentation__pager'
        itemClassName='view-pager-presentation__item'
        id='presentation-pager'
        style={{ height: `${pages[0].pagerHeight}px` }}
        main-thread:onOffsetChange={handleOffsetChangeMT}
        onPageChange={event => setIndex(event.detail.index)}
      >
        {page => (
          <view
            className='view-pager-presentation__card'
            style={{ height: `${page.cardHeight}px` }}
          >
            <text className='view-pager-presentation__letter'>
              {page.letter}
            </text>
            <text className='view-pager-presentation__title'>ViewPager</text>
            <text className='view-pager-presentation__subtitle'>
              @lynx-js/lynx-ui
            </text>
          </view>
        )}
      </ViewPager>
      <view className='view-pager-presentation__footer'>
        <text className='view-pager-presentation__progress'>
          {String(index + 1).padStart(2, '0')} /{' '}
          {String(pages.length).padStart(2, '0')}
        </text>
        <text className='view-pager-presentation__hint'>SWIPE TO SPELL</text>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
