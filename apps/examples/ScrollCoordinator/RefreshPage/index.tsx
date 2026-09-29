// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useRef, useState } from '@lynx-js/react'

import {
  Button,
  FeedList,
  ScrollCoordinator,
  ViewPager,
} from '@lynx-js/lynx-ui'
import type {
  FeedListRef,
  ScrollCoordinatorRef,
  ScrollCoordinatorRefreshOptions,
  ViewPagerRef,
} from '@lynx-js/lynx-ui'

import { sections } from '../shared/data'
import {
  CoordinatorControls,
  Cover,
  DemoLayout,
  Toolbar,
  renderStories,
} from '../shared/Demo'

function RefreshPage({ section, index }: { section: string, index: number }) {
  const feedList = useRef<FeedListRef>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [count, setCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const listId = `refresh-page-list-${index}`

  useEffect(() => () => clearTimeout(timer.current), [])

  const refreshOptions: ScrollCoordinatorRefreshOptions = {
    enableRefresh: true,
    headerContent: (
      <view className='sc-refresh-content'>
        <text className='sc-refresh-label'>
          {refreshing
            ? `Refreshing ${section}...`
            : `Pull to refresh ${section} · ${progress}%`}
        </text>
      </view>
    ),
    onRefreshOffsetChange: ({ offset, headerSize, isDragging }) => {
      if (isDragging && headerSize > 0) {
        setProgress(Math.round(offset / headerSize * 100))
      }
    },
    onStartRefresh: () => {
      clearTimeout(timer.current)
      setRefreshing(true)
      timer.current = setTimeout(() => {
        setCount(value => value + 1)
        setProgress(0)
        setRefreshing(false)
        feedList.current?.finishRefresh()
      }, 1400)
    },
  }

  return (
    <view className='sc-page'>
      <view className='sc-page-status'>
        <text className='sc-caption'>
          {`${section} · updates: ${count}`}
        </text>
      </view>
      <view className='sc-page-refresh'>
        <FeedList
          ref={feedList}
          className='sc-list'
          listId={listId}
          listType='single'
          spanCount={1}
          scrollOrientation='vertical'
          useRefactorList
          bounces
          refreshOptions={{ ...refreshOptions, mode: 'native' }}
        >
          {renderStories(listId)}
        </FeedList>
      </view>
    </view>
  )
}

function App() {
  const coordinator = useRef<ScrollCoordinatorRef>(null)
  const pager = useRef<ViewPagerRef>(null)
  const [enabled, setEnabled] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [sticky, setSticky] = useState(false)

  return (
    <DemoLayout
      title='Refresh per section'
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
        refreshInSlot
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
              {(section, index) => (
                <RefreshPage section={section} index={index} />
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
