// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Button, ViewPager } from '@lynx-js/lynx-ui'
import type { ViewPagerRef } from '@lynx-js/lynx-ui'

import './index.css'

const pages = [
  { label: 'Explore', className: 'view-pager-demo__page--primary' },
  { label: 'Create', className: 'view-pager-demo__page--secondary' },
  { label: 'Share', className: 'view-pager-demo__page--neutral' },
]

export function App() {
  const pagerRef = useRef<ViewPagerRef>(null)
  const [index, setIndex] = useState(0)
  return (
    <view className='view-pager-demo lunaris-dark'>
      <text className='view-pager-demo__title'>Swipe between pages</text>
      <view className='view-pager-demo__controls'>
        {pages.map((page, pageIndex) => (
          <Button
            key={page.label}
            onClick={() => pagerRef.current?.selectTab(pageIndex)}
          >
            <text className='view-pager-demo__control'>{page.label}</text>
          </Button>
        ))}
      </view>
      <ViewPager
        ref={pagerRef}
        data={pages}
        getItemKey={page => page.label}
        onPageChange={event => setIndex(event.detail.index)}
        className='view-pager-demo__pager'
        style={{ height: '400px' }}
        itemClassName='view-pager-demo__page'
        getItemProps={page => ({
          className: page.className,
          itemProps: { 'accessibility-label': page.label },
        })}
      >
        {page => <text className='view-pager-demo__label'>{page.label}</text>}
      </ViewPager>
      <text className='view-pager-demo__control'>
        Page {index + 1} of {pages.length}
      </text>
    </view>
  )
}

root.render(<App />)
