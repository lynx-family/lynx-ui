// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { List, ViewPager } from '@lynx-js/lynx-ui'

import { sections } from './data'
import './index.css'

function App() {
  const [pageIndex, setPageIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='header'>
        <text className='instruction'>
          Swipe horizontally between pages and vertically within each list.
        </text>
        <view className='tabs'>
          {sections.map((section, index) => (
            <text
              key={section.id}
              className={`tab ${index === pageIndex ? 'active' : ''}`}
            >
              {section.title}
            </text>
          ))}
        </view>
      </view>
      <ViewPager
        data={sections}
        getItemKey={section => section.id}
        onPageChange={event => setPageIndex(event.detail.index)}
        className='view-pager'
        itemClassName='view-pager-item'
        bounces={false}
      >
        {section => (
          <List
            className='list'
            listId={`view-pager-${section.id}-list`}
            listType='single'
            spanCount={1}
            scrollOrientation='vertical'
            useRefactorList={true}
            bounces={true}
          >
            {section.items.map(item => (
              <list-item key={item.id} item-key={item.id}>
                <view className='row'>
                  <text className='number'>
                    {item.number}
                  </text>
                </view>
              </list-item>
            ))}
          </List>
        )}
      </ViewPager>
    </view>
  )
}

root.render(<App />)

export default App
