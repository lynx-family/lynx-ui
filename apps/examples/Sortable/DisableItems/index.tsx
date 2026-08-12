// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useCallback, useMemo, useState } from '@lynx-js/react'

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

// Items that are locked from sorting. These rows cannot be dragged themselves
// and they always keep their absolute positions in the result.
const LOCKED_KEYS = new Set(['0', '5', '7', '10', '11'])

function scrollShortBoundaryBy(offset: number) {
  'main thread'
  lynx.querySelector('#disableItemsScrollView')?.invoke('scrollBy', {
    offset,
  })
}

export function App() {
  const [data, setData] = useState<SortableData<SortableDemoItem>[]>(
    () => createDemoData(18),
  )

  const handleSortEnd = useCallback(
    (sortedData: SortableData<SortableDemoItem>[]) => {
      setData(sortedData)
    },
    [],
  )

  const lockedKeys = useMemo(() => LOCKED_KEYS, [])

  const renderSortableItem = useCallback(
    (item: SortableData<SortableDemoItem>) => {
      const { id, tone } = item.dataItem
      const numericId = Number(id)
      const paletteIndex = numericId % 6
      const isLocked = lockedKeys.has(item.getSortingKey())

      return (
        <SortableItem
          key={item.getSortingKey()}
          as='DraggableRoot'
          className='sortable-item'
          sortingKey={item.getSortingKey()}
          disabled={isLocked}
        >
          <view
            className={`sortable-item-surface sortable-item--${paletteIndex} ${
              isLocked ? 'sortable-item-surface--locked' : ''
            }`}
          >
            <view className='sortable-item-content'>
              <text className={`sortable-item-title drag-here-text--${tone}`}>
                {`Row ${numericId + 1}`}
              </text>
              <text
                className={`sortable-item-subtitle sortable-item-subtitle--${tone}`}
              >
                {isLocked
                  ? 'Locked in this position'
                  : 'Drag to reorder around locked rows'}
              </text>
            </view>
            {isLocked
              ? (
                <view className='sortable-item-area sortable-item-area--locked'>
                  <text className='drag-here-text drag-here-text--locked'>
                    Locked
                  </text>
                </view>
              )
              : (
                <SortableItemArea className='sortable-item-area'>
                  <text className={`drag-here-text drag-here-text--${tone}`}>
                    Drag Here
                  </text>
                </SortableItemArea>
              )}
          </view>
        </SortableItem>
      )
    },
    [lockedKeys],
  )

  const handleScrollUpTap = useCallback(() => {
    'main thread'
    scrollShortBoundaryBy(-160)
  }, [])

  const handleScrollDownTap = useCallback(() => {
    'main thread'
    scrollShortBoundaryBy(160)
  }, [])

  return (
    <view className='demo-container lunaris-light'>
      <view className='scroll-boundary-info'>
        <text className='scroll-boundary-info-title'>Locked Items</text>
        <text className='scroll-boundary-info-description'>
          Rows 1, 6, 8, 11, and 12 stay fixed while unlocked rows move around
          them.
        </text>
      </view>

      <view className='scroll-controls'>
        <Button
          className='scroll-control-button'
          buttonProps={{
            'main-thread:bindtap': handleScrollUpTap,
          }}
        >
          <text className='scroll-control-label'>Scroll Up</text>
        </Button>
        <Button
          className='scroll-control-button scroll-control-button--primary'
          buttonProps={{
            'main-thread:bindtap': handleScrollDownTap,
          }}
        >
          <text className='scroll-control-label'>Scroll Down</text>
        </Button>
      </view>

      <SortableRoot
        data={data}
        onSortEnd={handleSortEnd}
        boundaryId='disableItemsSortableRoot'
        as='ScrollView'
        scrollableBoundaryId='disableItemsScrollView'
        scrollableClassName='short-scroll-view'
        scrollableContentClassName='sortable-root short-sortable-root'
        scrollableStickyUpperOffset={12}
        scrollableStickyLowerOffset={12}
      >
        {renderSortableItem}
      </SortableRoot>

      <view className='scroll-boundary-info'>
        <text className='scroll-boundary-info-title'>Sorting Behavior</text>
        <text className='scroll-boundary-info-description'>
          Drag an unlocked row across a locked row. The locked row stays in
          place while unlocked rows reorder around it.
        </text>
      </view>
    </view>
  )
}

root.render(<App />)
