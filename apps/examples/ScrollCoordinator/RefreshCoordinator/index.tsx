// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useRef, useState } from '@lynx-js/react'

import { ScrollCoordinator } from '@lynx-js/lynx-ui'
import type {
  ScrollCoordinatorRef,
  ScrollCoordinatorRefreshOptions,
} from '@lynx-js/lynx-ui'

import {
  CoordinatorControls,
  Cover,
  DemoLayout,
  RefreshControls,
  StoryList,
  Toolbar,
} from '../shared/Demo'

function App() {
  const coordinator = useRef<ScrollCoordinatorRef>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [count, setCount] = useState(0)
  const [enabled, setEnabled] = useState(true)
  const [progress, setProgress] = useState(0)
  const [refreshEnabled, setRefreshEnabled] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [source, setSource] = useState('none')
  const [sticky, setSticky] = useState(false)

  useEffect(() => () => clearTimeout(timer.current), [])

  const refreshOptions: ScrollCoordinatorRefreshOptions = {
    enableRefresh: refreshEnabled,
    headerContent: (
      <view className='sc-refresh-content'>
        <text className='sc-refresh-label'>
          {refreshing
            ? 'Refreshing collection...'
            : `Pull to refresh collection · ${progress}%`}
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
        setProgress(0)
        setRefreshing(false)
        coordinator.current?.finishRefresh()
      }, 1400)
    },
  }

  return (
    <DemoLayout
      title='Whole-page refresh'
      controls={
        <>
          <CoordinatorControls
            enabled={enabled}
            onExpand={() => coordinator.current?.scrollToTop(true)}
            onCollapse={() => coordinator.current?.scrollToSticky(true)}
            onShowDetails={() =>
              coordinator.current?.scrollIntoView('collection-details', true)}
            onToggleEnabled={() => setEnabled(value => !value)}
          />
          <RefreshControls
            enabled={refreshEnabled}
            onRefresh={() => coordinator.current?.startRefresh()}
            onToggleEnabled={() => setRefreshEnabled(value => !value)}
          />
        </>
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
        refreshOptions={refreshOptions}
        toolbar={<Toolbar status={sticky ? 'Pinned' : 'Explore'} />}
        headers={<Cover status={`${count} updates · ${source}`} />}
        slot={
          <StoryList
            listId='collection-list'
            bounces={false}
          />
        }
      />
    </DemoLayout>
  )
}

root.render(<App />)

export default App
