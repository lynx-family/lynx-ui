// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { List, ViewPager } from '@lynx-js/lynx-ui'

import './index.css'

const sections = [
  { id: 'recent', title: 'Recent', start: 1 },
  { id: 'saved', title: 'Saved', start: 11 },
  { id: 'shared', title: 'Shared', start: 21 },
].map(section => ({
  ...section,
  items: Array.from({ length: 12 }, (_, index) => ({
    id: `${section.id}-${index}`,
    number: section.start + index,
  })),
}))

function App() {
  const [pageIndex, setPageIndex] = useState(0)

  return (
    <view className='view-pager-nested-list lunaris-dark'>
      <view className='view-pager-nested-list__header'>
        <text className='view-pager-nested-list__heading'>Nested lists</text>
        <text className='view-pager-nested-list__intro'>
          Swipe horizontally between pages and vertically within each list.
        </text>
        <view className='view-pager-nested-list__tabs'>
          {sections.map((section, index) => (
            <text
              key={section.id}
              className={`view-pager-nested-list__tab ${
                index === pageIndex ? 'view-pager-nested-list__tab--active' : ''
              }`}
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
        className='view-pager-nested-list__pager'
        itemClassName='view-pager-nested-list__page'
        bounces={false}
      >
        {section => (
          <List
            className='view-pager-nested-list__list'
            listId={`view-pager-${section.id}-list`}
            listType='single'
            spanCount={1}
            scrollOrientation='vertical'
            useRefactorList={true}
            bounces={true}
          >
            {section.items.map(item => (
              <list-item key={item.id} item-key={item.id}>
                <view className='view-pager-nested-list__row'>
                  <text className='view-pager-nested-list__number'>
                    {item.number}
                  </text>
                  <view className='view-pager-nested-list__copy'>
                    <text className='view-pager-nested-list__title'>
                      {section.title} item {item.number}
                    </text>
                    <text className='view-pager-nested-list__description'>
                      Vertical content inside a horizontal page
                    </text>
                  </view>
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
