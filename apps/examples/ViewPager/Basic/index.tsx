// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ViewPager } from '@lynx-js/lynx-ui'

import './index.css'

const pages = [
  { label: 'Explore', className: 'view-pager-demo__page--primary' },
  { label: 'Create', className: 'view-pager-demo__page--secondary' },
  { label: 'Share', className: 'view-pager-demo__page--neutral' },
]

export function App() {
  return (
    <view className='view-pager-demo lunaris-light'>
      <text className='view-pager-demo__title'>Swipe between pages</text>
      <ViewPager
        className='view-pager-demo__pager'
        style={{ width: '100%', height: '400px' }}
      >
        {pages.map(page => (
          <view
            key={page.label}
            className={`view-pager-demo__page ${page.className}`}
          >
            <text className='view-pager-demo__label'>{page.label}</text>
          </view>
        ))}
      </ViewPager>
    </view>
  )
}

root.render(<App />)
