// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Button, ScrollCoordinator, ViewPager } from '@lynx-js/lynx-ui'
import type { ScrollCoordinatorRef, ViewPagerRef } from '@lynx-js/lynx-ui'

import { sections } from '../shared/data'
import {
  CoordinatorControls,
  Cover,
  DemoLayout,
  StoryList,
  Toolbar,
} from '../shared/Demo'

function App() {
  const coordinator = useRef<ScrollCoordinatorRef>(null)
  const pager = useRef<ViewPagerRef>(null)
  const [enabled, setEnabled] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [sticky, setSticky] = useState(false)

  return (
    <DemoLayout
      title='Coordinated pages'
      controls={
        <CoordinatorControls
          enabled={enabled}
          onExpand={() => coordinator.current?.scrollToTop(true)}
          onCollapse={() => coordinator.current?.scrollToSticky(true)}
          onShowDetails={() =>
            coordinator.current?.scrollIntoView('collection-details', true)}
          onToggleEnabled={() => setEnabled(value => !value)}
        />
      }
    >
      <ScrollCoordinator
        ref={coordinator}
        id='collection'
        className='sc-coordinator'
        style={{ width: '100%', height: '100%' }}
        enableScroll={enabled}
        onSticky={() => setSticky(true)}
        onLeaveSticky={() => setSticky(false)}
        toolbar={
          <Toolbar
            status={`${sections[pageIndex]} · ${sticky ? 'Pinned' : 'Explore'}`}
          />
        }
        headers={<Cover status='Latest stories' />}
        slot={
          <view className='sc-page'>
            <scroll-coordinator-slot-drag
              className='sc-tabs'
              enable-drag={false}
            >
              {sections.map((section, index) => (
                <Button
                  key={section}
                  className='sc-tab'
                  onClick={() => pager.current?.scrollToPage(index)}
                >
                  <text
                    className={index === pageIndex
                      ? 'sc-tab-label sc-selected'
                      : 'sc-tab-label'}
                  >
                    {section}
                  </text>
                  {index === pageIndex && <view className='sc-tab-indicator' />}
                </Button>
              ))}
            </scroll-coordinator-slot-drag>
            <ViewPager
              ref={pager}
              id='collection-pages'
              className='sc-pager'
              itemClassName='sc-pager-item'
              data={sections}
              getItemKey={section => section}
              onPageChange={event => setPageIndex(event.detail.index)}
            >
              {(_, index) => (
                <StoryList
                  listId={`collection-list-${index}`}
                />
              )}
            </ViewPager>
          </view>
        }
      />
    </DemoLayout>
  )
}

root.render(<App />)

export default App
