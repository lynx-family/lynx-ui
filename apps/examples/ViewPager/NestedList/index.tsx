// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { List, ViewPager } from '@lynx-js/lynx-ui'
import type { ViewPagerRef } from '@lynx-js/lynx-ui'

import { sections } from './data'
import { ListRow } from './ListRow'
import { SectionTabs } from './SectionTabs'
import './index.css'

function App() {
  const pagerRef = useRef<ViewPagerRef>(null)
  const [pageIndex, setPageIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark luna-gradient-rose'>
      <view className='header'>
        <text className='instruction'>
          Swipe horizontally between pages and vertically within each list.
        </text>
        <SectionTabs
          sections={sections}
          activeIndex={pageIndex}
          onSelect={index => pagerRef.current?.scrollToPage(index)}
        />
      </view>
      <ViewPager
        ref={pagerRef}
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
            {section.items.map(item => <ListRow key={item.id} item={item} />)}
          </List>
        )}
      </ViewPager>
    </view>
  )
}

root.render(<App />)

export default App
