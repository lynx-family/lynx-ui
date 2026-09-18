// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { ViewPager } from '@lynx-js/lynx-ui'

import './index.css'

const pages = [
  {
    title: 'First page',
    description: 'Swipe horizontally to see the next page.',
    className: 'view-pager-basic__page--primary',
  },
  {
    title: 'Second page',
    description: 'Each data entry becomes one native pager item.',
    className: 'view-pager-basic__page--secondary',
  },
  {
    title: 'Third page',
    description: 'Static collections can use the default index keys.',
    className: 'view-pager-basic__page--neutral',
  },
]

export function App() {
  const [index, setIndex] = useState(0)

  return (
    <view className='view-pager-basic lunaris-dark'>
      <text className='view-pager-basic__heading'>Basic ViewPager</text>
      <ViewPager
        data={pages}
        onPageChange={event => setIndex(event.detail.index)}
        className='view-pager-basic__pager'
        itemClassName='view-pager-basic__item'
      >
        {page => (
          <view className={`view-pager-basic__content ${page.className}`}>
            <text className='view-pager-basic__title'>{page.title}</text>
            <text className='view-pager-basic__description'>
              {page.description}
            </text>
          </view>
        )}
      </ViewPager>
      <text className='view-pager-basic__status'>
        Page {index + 1} of {pages.length}
      </text>
    </view>
  )
}

root.render(<App />)
