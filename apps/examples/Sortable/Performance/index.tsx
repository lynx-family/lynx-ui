// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useCallback, useEffect, useState } from '@lynx-js/react'

import './index.css'

import { SortableItem, SortableItemArea, SortableRoot } from '@lynx-js/lynx-ui'
import type { SortableData } from '@lynx-js/lynx-ui'

import { ITEM_COUNT, createPerformanceData } from './data'
import type { OrderItem } from './data'

let renderItemCalls = 0
let activeDragFlowId: number | undefined

function isProfiling() {
  return lynx.performance?.isProfileRecording?.() === true
}

function markMountedProfile() {
  if (!isProfiling()) return

  lynx.performance.profileMark('Sortable90::mounted', {
    args: {
      dataItems: String(ITEM_COUNT),
      renderItemCalls: String(renderItemCalls),
    },
  })
}

function startDragProfile() {
  if (!isProfiling()) return

  activeDragFlowId = lynx.performance.profileFlowId()
  const option = {
    flowId: activeDragFlowId,
    args: {
      dataItems: String(ITEM_COUNT),
      renderItemCalls: String(renderItemCalls),
    },
  }
  lynx.performance.profileStart('Sortable90::dragGesture', option)
  lynx.performance.profileMark('Sortable90::dragStart', option)
}

function endDragProfile(changedPositions: number) {
  if (!isProfiling()) return

  lynx.performance.profileMark('Sortable90::sortCommit', {
    flowId: activeDragFlowId,
    args: {
      changedPositions: String(changedPositions),
      renderItemCallsBeforeCommit: String(renderItemCalls),
    },
  })
  lynx.performance.profileEnd()
  activeDragFlowId = undefined
}

function countChangedPositions(
  previous: SortableData<OrderItem>[],
  next: SortableData<OrderItem>[],
) {
  let changedPositions = 0
  for (let index = 0; index < next.length; index++) {
    if (
      previous[index]?.getSortingKey() !== next[index]?.getSortingKey()
    ) {
      changedPositions++
    }
  }
  return changedPositions
}

interface Sortable90CardProps {
  item: OrderItem
}

function Sortable90Card({ item }: Sortable90CardProps) {
  return (
    <view className='order-card-content'>
      <view className='order-card-copy'>
        <text className='order-eyebrow'>
          {item.id} · {item.region}
        </text>
        <text className='order-title'>{item.title}</text>
        <text className='order-assignee'>◉ {item.assignee}</text>
        <view className='order-code-row'>
          <text className='order-code'>{item.trackingCode}</text>
          <text className='order-tag'>COD</text>
        </view>
      </view>
      <SortableItemArea className='drag-handle'>
        <text className='drag-handle-icon'>≡</text>
      </SortableItemArea>
    </view>
  )
}

Sortable90Card.displayName = 'Sortable90Card'

export function App() {
  const [data, setData] = useState<SortableData<OrderItem>[]>(
    createPerformanceData,
  )

  useEffect(() => {
    markMountedProfile()
  }, [])

  const handleSortStart = useCallback(() => {
    startDragProfile()
  }, [])

  const handleSortEnd = useCallback(
    (sortedData: SortableData<OrderItem>[]) => {
      const changedPositions = countChangedPositions(data, sortedData)
      endDragProfile(changedPositions)
      setData(sortedData)
    },
    [data],
  )

  const renderSortableItem = useCallback(
    (item: SortableData<OrderItem>) => {
      renderItemCalls++
      const sortingKey = item.getSortingKey()

      return (
        <SortableItem
          key={sortingKey}
          as='DraggableRoot'
          className='order-card'
          sortingKey={sortingKey}
        >
          <Sortable90Card item={item.dataItem} />
        </SortableItem>
      )
    },
    [],
  )

  return (
    <view className='demo-container luna-light'>
      <view className='header'>
        <text className='item-count'>{ITEM_COUNT} items</text>
        <text className='instruction'>
          Drag the handle; hold near an edge to auto-scroll
        </text>
      </view>

      <view className='trace-hint'>
        <text className='trace-hint-text'>
          Trace markers: Sortable90::dragStart → Sortable90::sortCommit
        </text>
      </view>

      <SortableRoot
        as='ScrollView'
        data={data}
        onSortStart={handleSortStart}
        onSortEnd={handleSortEnd}
        scrollableClassName='sortable-scroll'
        scrollableContentClassName='sortable-list'
        scrollableStickyUpperOffset={24}
        scrollableStickyLowerOffset={24}
      >
        {renderSortableItem}
      </SortableRoot>
    </view>
  )
}

App.displayName = 'Sortable90PerformanceApp'

export default App

root.render(<App />)
