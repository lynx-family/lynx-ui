// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useCallback, useEffect, useState } from '@lynx-js/react'

import './index.css'

import { SortableItem, SortableItemArea, SortableRoot } from '@lynx-js/lynx-ui'
import type { SortableData } from '@lynx-js/lynx-ui'

// cspell:ignore Adelia Apotek Bantul Cahyani Daerah Esthi kesehatan Klinik konsultasi Kota layanan pasien Penambahan pusat Puskesmas rehabilitasi Rumah ruang Sakit Senopati serta Sihono Sinduadi Sleman Sudirohusodo Susi Trirenggo Umum warga Yani Yogyakarta
const ITEM_COUNT = 90

interface OrderItem {
  id: string
  region: string
  title: string
  assignee: string
  trackingCode: string
}

const REGIONS = [
  'Kab. Bantul, Trirenggo',
  'Kab. Sleman, Sinduadi',
  'Kota Yogyakarta',
]

const LOCATIONS = [
  'Rumah Sakit Umum Daerah Penambahan Senopati',
  'Puskesmas Trirenggo dan layanan kesehatan warga',
  'Klinik Sudirohusodo dan pusat rehabilitasi',
  'Apotek Bantul serta ruang konsultasi pasien',
]

const ASSIGNEES = [
  'Adelia Cahyani',
  'Sihono Pilot',
  'Esthi Susi',
  'Indra Yani',
]

function createPerformanceData(): SortableData<OrderItem>[] {
  return Array.from({ length: ITEM_COUNT }, (_, index) => {
    const position = index + 1
    const id = String(position).padStart(2, '0')

    return {
      dataItem: {
        id,
        region: REGIONS[index % REGIONS.length],
        title: `${LOCATIONS[index % LOCATIONS.length]} #${id}`,
        assignee: ASSIGNEES[index % ASSIGNEES.length],
        trackingCode: `GTL${String(7_020_000_000 + position * 7_319)}`,
      },
      getSortingKey: () => `order-${id}`,
    }
  })
}

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
    <view className='performance-page'>
      <view className='performance-header'>
        <view>
          <text className='performance-title'>Sortable 90</text>
          <text className='performance-subtitle'>
            Drag the handle and hold near an edge to stress auto-scroll
          </text>
        </view>
        <view className='performance-badge'>
          <text className='performance-badge-value'>90</text>
          <text className='performance-badge-label'>items</text>
        </view>
      </view>

      <view className='trace-hint'>
        <text className='trace-hint-dot'>●</text>
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
