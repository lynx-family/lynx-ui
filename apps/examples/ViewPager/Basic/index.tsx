// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { ViewPager } from '@lynx-js/lynx-ui'

import { pages } from './data'
import './index.css'

export function App() {
  const [index, setIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='heading'>Basic ViewPager</text>
      <ViewPager
        data={pages}
        onPageChange={event => setIndex(event.detail.index)}
        className='view-pager'
        itemClassName='view-pager-item'
      >
        {page => (
          <view className={`page ${page.className}`}>
            <text className='title'>{page.title}</text>
            <text className='description'>
              {page.description}
            </text>
          </view>
        )}
      </ViewPager>
      <text className='status'>
        Page {index + 1} of {pages.length}
      </text>
    </view>
  )
}

root.render(<App />)
