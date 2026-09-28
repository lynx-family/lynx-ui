// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import {
  List,
  ScrollCoordinator,
  TabsBar,
  TabsIndicator,
  TabsItem,
  TabsRoot,
  ViewPager,
} from '@lynx-js/lynx-ui'
import type { TabsRootRef, ViewPagerRef } from '@lynx-js/lynx-ui'

import { sections } from './data'
import './index.css'

const tabs = sections.map(section => ({
  tabItem: section,
  getTabKey: () => section.id,
}))

function App() {
  const pager = useRef<ViewPagerRef>(null)
  const tabsRoot = useRef<TabsRootRef>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [sticky, setSticky] = useState(false)

  return (
    <view className='sc-demo lunaris-dark'>
      <view className='sc-masthead'>
        <text className='sc-brand'>lynx-ui / ScrollCoordinator</text>
        <text className='sc-mode'>ViewPager + List</text>
        <text className='sc-caption'>
          Scroll to fold the cover. Swipe or tap a section, then come back to
          where you left off.
        </text>
      </view>
      <view className='sc-frame'>
        <ScrollCoordinator
          className='sc-coordinator'
          onSticky={() => setSticky(true)}
          onLeaveSticky={() => setSticky(false)}
          toolbar={
            <view className='sc-toolbar'>
              <text className='sc-toolbar-title'>The reading room</text>
              <text className='sc-toolbar-status'>
                {`${sections[pageIndex].title} · ${
                  sticky ? 'Pinned' : 'Explore'
                }`}
              </text>
            </view>
          }
          headers={
            <view className='sc-cover'>
              <view className='sc-hero'>
                <text className='sc-hero-kicker'>A MOMENT TO YOURSELF</text>
                <text className='sc-hero-title'>Read something good.</text>
                <text className='sc-hero-caption'>
                  Three collections, ready when you are.
                </text>
              </view>
              <view className='sc-details'>
                <text className='sc-detail-title'>
                  Pick up where you left off.
                </text>
                <text className='sc-caption'>
                  30 reads in each section. Keep exploring at your own pace.
                </text>
              </view>
            </view>
          }
          slot={
            <view className='sc-page'>
              <scroll-coordinator-slot-drag
                className='sc-tabs'
                enable-drag={false}
              >
                <TabsRoot
                  ref={tabsRoot}
                  onClickItem={index => pager.current?.scrollToPage(index)}
                >
                  <TabsBar
                    className='sc-composed-tabs'
                    tabsItemWrapperClass='sc-composed-tabs-items'
                    data={tabs}
                    renderTabItem={item => (
                      <TabsItem
                        key={item.getTabKey()}
                        tabKey={item.getTabKey()}
                        className='sc-tab'
                      >
                        <text
                          className={item.tabItem.id === sections[pageIndex].id
                            ? 'sc-tab-label sc-selected'
                            : 'sc-tab-label'}
                        >
                          {item.tabItem.title}
                        </text>
                      </TabsItem>
                    )}
                  >
                    <TabsIndicator className='sc-composed-tabs-indicator'>
                      <view className='sc-composed-tabs-indicator-line' />
                    </TabsIndicator>
                  </TabsBar>
                </TabsRoot>
              </scroll-coordinator-slot-drag>
              <ViewPager
                ref={pager}
                className='sc-pager'
                itemClassName='sc-pager-item'
                data={sections}
                getItemKey={section => section.id}
                bounces={false}
                onPageChange={event => {
                  const index = event.detail.index
                  setPageIndex(index)
                  // Synchronize selection without triggering another pager command.
                  tabsRoot.current?.selectTab(index, true)
                }}
              >
                {section => (
                  <List
                    className='sc-list'
                    listId={`reading-room-${section.id}`}
                    listType='single'
                    spanCount={1}
                    scrollOrientation='vertical'
                    useRefactorList
                    bounces
                  >
                    {section.items.map(item => (
                      <list-item key={item.id} item-key={item.id}>
                        <view className='sc-story'>
                          <view className='sc-story-number'>
                            <text className='sc-number'>{item.number}</text>
                          </view>
                          <view className='sc-story-copy'>
                            <text className='sc-eyebrow'>{section.title}</text>
                            <text className='sc-story-title'>{item.title}</text>
                            <text className='sc-caption'>
                              {item.description}
                            </text>
                          </view>
                        </view>
                      </list-item>
                    ))}
                  </List>
                )}
              </ViewPager>
            </view>
          }
        />
      </view>
    </view>
  )
}

root.render(<App />)

export default App
