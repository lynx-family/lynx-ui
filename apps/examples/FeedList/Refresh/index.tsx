// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useMemo, useRef, useState } from '@lynx-js/react'

import { Button, FeedList } from '@lynx-js/lynx-ui'
import type { FeedListRef } from '@lynx-js/lynx-ui'

import { FEED_INITIAL, FEED_REFRESH } from './data'
import type { LetterItem } from './data'
import { RectangleCard } from '../shared/RectangleCard'
import { RefreshHeader } from '../shared/RefreshHeader'
import './index.css'

function App() {
  const feedListRef = useRef<FeedListRef>(null)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refreshing = useRef(false)
  const showRefreshSet = useRef(false)

  const [items, setItems] = useState<LetterItem[]>(FEED_INITIAL)

  useEffect(() => {
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current)
      }
    }
  }, [])

  const refreshHeader = useMemo(
    () => <RefreshHeader text='Refreshing' />,
    [],
  )

  const startRefresh = () => {
    if (refreshing.current) {
      return
    }

    feedListRef.current?.startRefresh()
  }

  const handleStartRefresh = (
    _event: { triggeredBy: 'startRefresh' | 'drag' },
  ) => {
    refreshing.current = true

    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current)
    }

    refreshTimer.current = setTimeout(() => {
      showRefreshSet.current = !showRefreshSet.current
      const nextItems = showRefreshSet.current ? FEED_REFRESH : FEED_INITIAL
      setItems(nextItems)

      feedListRef.current?.finishRefresh()
      refreshing.current = false
    }, 1500)
  }

  return (
    <view className='lunaris-dark demo-container'>
      <FeedList
        className='feed-list'
        listId='feedListRefresh'
        ref={feedListRef}
        listType='single'
        spanCount={1}
        scrollOrientation='vertical'
        refreshOptions={{
          enableRefresh: true,
          headerContent: refreshHeader,
          onStartRefresh: handleStartRefresh,
        }}
        useRefactorList={true}
        bounces={false}
      >
        <list-item item-key='demo-header'>
          <view className='demo-header' />
        </list-item>
        {items.map((item: LetterItem) => (
          <list-item key={item.key} item-key={item.key}>
            <RectangleCard
              letter={item.letter}
              height={500}
            />
          </list-item>
        ))}
        <list-item item-key='demo-footer'>
          <view className='demo-footer' />
        </list-item>
      </FeedList>
      <view className='demo-actions'>
        <Button
          className='action-button'
          onClick={() => {
            startRefresh()
          }}
        >
          <text className='action-button__text'>Refresh</text>
        </Button>
      </view>
    </view>
  )
}

root.render(<App />)
export default App
