// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useMemo, useRef, useState } from '@lynx-js/react'

import { FeedList } from '@lynx-js/lynx-ui'
import type { FeedListRef } from '@lynx-js/lynx-ui'

import { FEED_INITIAL, FEED_MORE, FEED_REFRESH } from './data'
import type { LetterItem } from './data'
import { RectangleCard } from './RectangleCard'

import './index.css'

function App() {
  const feedListRef = useRef<FeedListRef>(null)
  const [items, setItems] = useState<LetterItem[]>(FEED_INITIAL)
  const noMoreData = useRef(false)

  const renderRefreshHeader = useMemo(
    () => (
      <view className='refresh-header'>
        <image
          src='https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/plugin/static/loading.gif'
          style={{
            width: '50px',
            height: '50px',
            relativeCenter: 'horizontal',
          }}
        />
      </view>
    ),
    [],
  )

  const renderLoadMoreFooter = useMemo(
    () => (
      <list-item key='footer' item-key='footer' full-span>
        <view
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <text style={{ marginBottom: '10px' }}>loading more...</text>
          <image
            src='https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/plugin/static/loading.gif'
            style={{ width: '50px', height: '50px' }}
          />
        </view>
      </list-item>
    ),
    [],
  )

  const renderNoMoreFooter = useMemo(
    () => (
      <list-item key='noMore' item-key='noMore' full-span>
        <text style={{ width: '100%', height: '30px', textAlign: 'center' }}>
          That's everything!
        </text>
      </list-item>
    ),
    [],
  )

  const handleRefresh = () => {
    setTimeout(() => {
      // Reset so load-more can fire again after refresh
      noMoreData.current = false
      setItems(prev =>
        prev[0]?.key.startsWith('refresh-') ? FEED_INITIAL : FEED_REFRESH
      )
      feedListRef.current?.finishRefresh()
    }, 2000)
  }

  const handleLoadMore = () => {
    if (noMoreData.current) return
    setTimeout(() => {
      noMoreData.current = true
      setItems(prev => [...prev, ...FEED_MORE])
      feedListRef.current?.changeHasMoreStatus(false)
    }, 2000)
  }

  return (
    <view className='lunaris-dark demo-container'>
      <FeedList
        className='feed-list'
        listId='feedListBasic'
        ref={feedListRef}
        listType='single'
        spanCount={1}
        scrollOrientation='vertical'
        refreshOptions={{
          enableRefresh: true,
          headerContent: renderRefreshHeader,
          onStartRefresh: handleRefresh,
        }}
        loadMoreFooter={renderLoadMoreFooter}
        noMoreDataFooter={renderNoMoreFooter}
        useRefactorList={true}
        bounces={false}
        upperThresholdItemCount={1}
        lowerThresholdItemCount={1}
        onScrollToLower={handleLoadMore}
      >
        <list-item item-key='demo-header'>
          <view className='demo-header' />
        </list-item>
        {items.map((item: LetterItem) => (
          <list-item key={item.key} item-key={item.key}>
            <RectangleCard
              cardKey={item.key}
              letter={item.letter}
              height={500}
            />
          </list-item>
        ))}
        <list-item item-key='demo-footer'>
          <view className='demo-footer' />
        </list-item>
      </FeedList>
    </view>
  )
}

root.render(<App />)
export default App
