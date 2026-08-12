// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useCallback, useState } from '@lynx-js/react'

import './index.css'

import {
  Button,
  SortableItem,
  SortableItemArea,
  SortableRoot,
} from '@lynx-js/lynx-ui'
import type { SortableData } from '@lynx-js/lynx-ui'

import type { SortableDemoItem } from '../shared/data'
import { createDemoData } from '../shared/data'

function scrollBoundaryBy(offset: number) {
  'main thread'
  lynx.querySelector('#sortableScrollableBoundary')?.invoke('scrollBy', {
    offset,
  })
}

export function App() {
  const [data, setData] = useState<SortableData<SortableDemoItem>[]>(
    () => createDemoData(16),
  )

  const handleSortEnd = useCallback(
    (sortedData: SortableData<SortableDemoItem>[]) => {
      setData(sortedData)
    },
    [],
  )

  const renderSortableItem = useCallback(
    (item: SortableData<SortableDemoItem>) => {
      const { id, tone } = item.dataItem
      const numericId = Number(id)
      const paletteIndex = numericId % 6

      return (
        <SortableItem
          key={item.getSortingKey()}
          as='DraggableRoot'
          className='sortable-item'
          sortingKey={item.getSortingKey()}
        >
          <view
            className={`sortable-item-surface sortable-item--${paletteIndex}`}
          >
            <view className='sortable-item-content'>
              <text className={`sortable-item-title drag-here-text--${tone}`}>
                {`Option ${numericId + 1}`}
              </text>
              <text
                className={`sortable-item-subtitle sortable-item-subtitle--${tone}`}
              >
                Drag near the edge
              </text>
            </view>
            <SortableItemArea className='sortable-item-area'>
              <text className={`drag-here-text drag-here-text--${tone}`}>
                Drag Here
              </text>
            </SortableItemArea>
          </view>
        </SortableItem>
      )
    },
    [],
  )

  return (
    <view className='demo-container lunaris-dark'>
      <view className='scroll-controls'>
        <Button
          className='scroll-control-button'
          buttonProps={{
            'main-thread:bindtap': () => {
              'main thread'
              scrollBoundaryBy(-160)
            },
          }}
        >
          <text className='scroll-control-label'>Scroll Up</text>
        </Button>
        <Button
          className='scroll-control-button scroll-control-button--primary'
          buttonProps={{
            'main-thread:bindtap': () => {
              'main thread'
              scrollBoundaryBy(160)
            },
          }}
        >
          <text className='scroll-control-label'>Scroll Down</text>
        </Button>
      </view>
      <SortableRoot
        data={data}
        onSortEnd={handleSortEnd}
        boundaryId='sortableRoot'
        as='ScrollView'
        scrollableBoundaryId='sortableScrollableBoundary'
        scrollableClassName='scroll-view'
        scrollableContentClassName='sortable-root scrollable-boundary-root'
        scrollableStickyUpperOffset={12}
        scrollableStickyLowerOffset={12}
      >
        {renderSortableItem}
      </SortableRoot>
    </view>
  )
}

root.render(<App />)
