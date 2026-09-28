// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useRef, useState } from '@lynx-js/react'

import { FeedList, List, ScrollCoordinator, ViewPager } from '@lynx-js/lynx-ui'
import type {
  FeedListRef,
  ScrollCoordinatorRef,
  ScrollCoordinatorRefreshOptions,
  ViewPagerRef,
} from '@lynx-js/lynx-ui'

import './base.css'

const sections = ['For you', 'Design', 'Technology']
const stories = [
  ['Small details, big ideas', 'A collection of things worth noticing.'],
  ['A quieter kind of interface', 'Make room for what matters.'],
  ['Color in everyday places', 'Fresh perspectives, close to home.'],
  ['The rhythm of a good day', 'Thoughtful routines and new discoveries.'],
  ['Built for curiosity', 'Follow an idea a little further.'],
  ['Notes from the studio', 'Experiments, sketches, and works in progress.'],
  ['Beyond the first impression', 'A closer look at how things work.'],
  ['A different point of view', 'There is always more to explore.'],
]

type DemoMode = 'List' | 'ViewPager' | 'RefreshCoordinator' | 'RefreshPage'

function useDemoRefresh(label: string, finish: () => void) {
  const [refreshing, setRefreshing] = useState(false)
  const [count, setCount] = useState(0)
  const [source, setSource] = useState('none')
  const [progress, setProgress] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const options: ScrollCoordinatorRefreshOptions = {
    enableRefresh: true,
    headerContent: (
      <view className='sc-refresh-content'>
        <text className='sc-refresh-label'>
          {refreshing
            ? `Refreshing ${label}...`
            : `Pull to refresh ${label} · ${progress}%`}
        </text>
      </view>
    ),
    onRefreshOffsetChange: ({ offset, headerSize, isDragging }) => {
      if (isDragging && headerSize > 0) {
        setProgress(Math.round(offset / headerSize * 100))
      }
    },
    onStartRefresh: ({ triggeredBy }) => {
      clearTimeout(timer.current)
      setSource(triggeredBy)
      setRefreshing(true)
      timer.current = setTimeout(() => {
        setCount(value => value + 1)
        setRefreshing(false)
        setProgress(0)
        finish()
      }, 1400)
    },
  }
  return { count, source, options }
}

function Story({ index, section }: { index: number, section: string }) {
  const story = stories[index % stories.length]
  return (
    <view className='sc-story'>
      <view className='sc-story-number'>
        <text className='sc-number'>{String(index + 1).padStart(2, '0')}</text>
      </view>
      <view className='sc-story-copy'>
        <text className='sc-eyebrow'>{section.toUpperCase()}</text>
        <text className='sc-story-title'>{story[0]}</text>
        <text className='sc-caption'>{story[1]}</text>
      </view>
    </view>
  )
}

function renderStories(section: string, listId: string) {
  return Array.from(
    { length: 16 },
    (_, index) => (
      <list-item key={index} item-key={`${listId}-${index}`}>
        <Story index={index} section={section} />
      </list-item>
    ),
  )
}

function StoryList({ section, listId, bounces = true }: {
  section: string
  listId: string
  bounces?: boolean
}) {
  return (
    <List
      className='sc-list'
      listId={listId}
      listType='single'
      spanCount={1}
      scrollOrientation='vertical'
      useRefactorList
      bounces={bounces}
    >
      {renderStories(section, listId)}
    </List>
  )
}

function RefreshPage({ section, index }: { section: string, index: number }) {
  const feedList = useRef<FeedListRef>(null)
  const refresh = useDemoRefresh(
    section,
    () => feedList.current?.finishRefresh(),
  )
  const listId = `refresh-page-list-${index}`
  return (
    <view className='sc-page'>
      <view className='sc-page-status'>
        <text className='sc-caption'>
          {`${section} · updates: ${refresh.count}`}
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
          refreshOptions={{ ...refresh.options, mode: 'native' }}
        >
          {renderStories(section, listId)}
        </FeedList>
      </view>
    </view>
  )
}

export function Demo({ mode }: { mode: DemoMode }) {
  const coordinator = useRef<ScrollCoordinatorRef>(null)
  const pager = useRef<ViewPagerRef>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [sticky, setSticky] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [offset, setOffset] = useState(0)
  const [refreshEnabled, setRefreshEnabled] = useState(true)
  const refresh = useDemoRefresh(
    'collection',
    () => coordinator.current?.finishRefresh(),
  )
  const hasPages = mode === 'ViewPager' || mode === 'RefreshPage'
  const titles = {
    List: 'Collapsible collection',
    ViewPager: 'Coordinated pages',
    RefreshCoordinator: 'Whole-page refresh',
    RefreshPage: 'Refresh per section',
  }
  const instructions = {
    List: 'Scroll the list to collapse the cover. Try the controls below.',
    ViewPager: 'Swipe between sections. Each list keeps its scroll position.',
    RefreshCoordinator:
      'Pull down from the top to refresh the whole collection.',
    RefreshPage: 'Each section has its own pull-to-refresh and update count.',
  }

  return (
    <view className='sc-demo lunaris-dark'>
      <view className='sc-masthead'>
        <text className='sc-brand'>lynx-ui / ScrollCoordinator</text>
        <text className='sc-mode'>{titles[mode]}</text>
        <text className='sc-caption'>{instructions[mode]}</text>
      </view>
      <view className='sc-controls'>
        <view
          className='sc-control'
          bindtap={() => coordinator.current?.scrollToTop(true)}
        >
          <text className='sc-control-label'>Expand</text>
        </view>
        <view
          className='sc-control'
          bindtap={() => coordinator.current?.scrollToSticky(true)}
        >
          <text className='sc-control-label'>Collapse</text>
        </view>
        <view
          className='sc-control'
          bindtap={() =>
            coordinator.current?.scrollIntoView('collection-details', true)}
        >
          <text className='sc-control-label'>Details</text>
        </view>
        <view
          className='sc-control'
          bindtap={() => setEnabled(value => !value)}
        >
          <text className='sc-control-label'>
            {enabled ? 'Lock' : 'Unlock'}
          </text>
        </view>
      </view>
      {mode === 'RefreshCoordinator' && (
        <view className='sc-controls'>
          <view
            className='sc-control'
            bindtap={() => coordinator.current?.startRefresh()}
          >
            <text className='sc-control-label'>Refresh now</text>
          </view>
          <view
            className='sc-control'
            bindtap={() => setRefreshEnabled(value => !value)}
          >
            <text className='sc-control-label'>
              {refreshEnabled ? 'Disable refresh' : 'Enable refresh'}
            </text>
          </view>
        </view>
      )}
      <view className='sc-frame'>
        <ScrollCoordinator
          ref={coordinator}
          id='collection'
          className='sc-coordinator'
          style={{ width: '100%', height: '100%' }}
          enableScroll={enabled}
          onOffsetChange={event => setOffset(Math.round(event.offset))}
          onSticky={() => setSticky(true)}
          onLeaveSticky={() => setSticky(false)}
          refreshInSlot={mode === 'RefreshPage'}
          refreshOptions={mode === 'RefreshCoordinator'
            ? { ...refresh.options, enableRefresh: refreshEnabled }
            : false}
          toolbar={
            <view className='sc-toolbar'>
              <text className='sc-toolbar-title'>The collection</text>
              <text className='sc-toolbar-status'>
                {sticky ? 'Pinned' : `${offset}px`}
                {enabled ? '' : ' · locked'}
              </text>
            </view>
          }
          headers={
            <view className='sc-cover'>
              <view className='sc-hero'>
                <text className='sc-hero-kicker'>THE DAILY EDIT / VOL. 01</text>
                <text className='sc-hero-title'>Stay curious.</text>
                <text className='sc-hero-caption'>
                  Ideas for a more thoughtful everyday.
                </text>
              </view>
              <view id='collection-details' className='sc-details'>
                <text className='sc-detail-title'>
                  A little inspiration, every day.
                </text>
                <text className='sc-caption'>
                  {mode === 'RefreshCoordinator'
                    ? `Collection updates: ${refresh.count} · ${refresh.source}`
                    : 'Three perspectives. One place to explore.'}
                </text>
              </view>
            </view>
          }
          slot={hasPages
            ? (
              <view className='sc-page'>
                <scroll-coordinator-slot-drag
                  enable-drag={false}
                  className='sc-tabs'
                >
                  {sections.map((section, index) => (
                    <view
                      key={section}
                      className='sc-tab'
                      bindtap={() => pager.current?.scrollToPage(index)}
                    >
                      <text
                        className={index === pageIndex
                          ? 'sc-tab-label sc-selected'
                          : 'sc-tab-label'}
                      >
                        {section}
                      </text>
                      {index === pageIndex && (
                        <view className='sc-tab-indicator' />
                      )}
                    </view>
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
                  {(section, index) =>
                    mode === 'RefreshPage'
                      ? <RefreshPage section={section} index={index} />
                      : (
                        <StoryList
                          section={section}
                          listId={`collection-list-${index}`}
                        />
                      )}
                </ViewPager>
              </view>
            )
            : (
              <StoryList
                section='For you'
                listId='collection-list'
                bounces={mode !== 'RefreshCoordinator'}
              />
            )}
        />
      </view>
    </view>
  )
}
