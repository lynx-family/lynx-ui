// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useCallback, useMemo, useState } from '@lynx-js/react'

import './index.css'

import { SortableItem, SortableItemArea, SortableRoot } from '@lynx-js/lynx-ui'
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
              <text className='sortable-item-subtitle'>
                {isLocked
                  ? 'Locked · cannot be dragged or displaced'
                  : 'Drag handle on the right to reorder'}
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
                    Drag
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
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='outside-panel outside-panel--top'>
        <text className='outside-panel-title'>Locked rows demo</text>
        <text className='outside-panel-copy'>
          Rows 1, 6, 8 and 12 are locked. They never move and are never
          displaced, but other rows can freely cross over them while sorting.
        </text>
      </view>

      <view className='scroll-by-actions'>
        <view
          className='scroll-by-button'
          main-thread:bindtap={handleScrollUpTap}
        >
          <text className='scroll-by-button-text'>Scroll Up</text>
        </view>
        <view
          className='scroll-by-button scroll-by-button--primary'
          main-thread:bindtap={handleScrollDownTap}
        >
          <text className='scroll-by-button-text'>Scroll Down</text>
        </view>
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

      <view className='outside-panel outside-panel--bottom'>
        <text className='outside-panel-title'>Behavior</text>
        <text className='outside-panel-copy'>
          Locked rows always keep their absolute positions. Other rows are
          reordered around them, sliding past at a higher speed so the gap stays
          in sync with the dragged item.
        </text>
      </view>
    </view>
  )
}

root.render(<App />)
